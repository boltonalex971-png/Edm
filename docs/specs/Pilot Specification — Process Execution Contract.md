# Pilot Specification: Process Execution Contract

**Contract-Based Plugin Isolation — First Implementation**

| | |
|---|---|
| Document | Specification for the pilot of the EDM Platform API contract architecture |
| Pilot scope | Decoupling of `Microprojects.Edm.Ui.Logistics` and `Microprojects.Edm.Ui.Technologies` via the `Microprojects.Edm.Contracts.ProcessExecution` assembly |
| Interaction model | Uni-directional command-query (Logistics → Technologies only) |
| Companion document | "Перспективная разработка EDM v2.md" (Russian roadmap) — §4.5 references this spec |
| Version | 1.0 |
| Date | 2026-05-28 |

---

## 1. Purpose and Rationale

### 1.1. Why this pilot

EDM's plugin model already separates implementations along technical lines (drivers, profiles, operations). The next step is to apply the same principle to **domain boundaries**: pairs of plugins that interact through stable, versioned contracts rather than through direct knowledge of each other's internals or shared database tables.

Logistics and Technologies have an existing, real-world dependency: Logistics owns the workflow (orders, items, tares, operator desktop) and Technologies owns the execution (driver invocation, audit collection, hardware control). Today this dependency is implicit — Logistics either reaches into Technologies' code or coordinates through a shared assumption about ИСТП2. Replacing that with a typed contract proves the entire approach on a real production coupling, not on a synthetic example.

### 1.2. Why uni-directional

Process execution is naturally a **command-query** interaction:

- At start, Logistics hands Technologies a complete snapshot of everything needed: process identifier, input items with addresses, output tare reservations by quality grade, operator context.
- During execution, no further data flow is required from Logistics. Inputs are frozen by definition of "operation is running."
- At completion, Logistics requests the audit result and applies it locally (assigning grades, distributing outputs to tares).

A bi-directional gateway pair would require Technologies to expose a callback contract Logistics implements. For this interaction, that callback is unused — Technologies never needs to query Logistics during execution. A uni-directional contract is structurally simpler, cheaper to build, and produces a stronger decoupling: Technologies has zero references to Logistics or its types.

### 1.3. Goals

1. Establish `Microprojects.Edm.Contracts.ProcessExecution` as a reference for all future EDM Platform API contracts.
2. Replace the current direct coupling between Logistics and Technologies with calls through this contract.
3. Deliver two production-quality implementations: in-process (via DI in a single WebApi host) and gRPC (for distributed deployment).
4. Establish reusable infrastructure: contract-test framework, semver versioning conventions, gRPC bootstrap with mTLS, configuration-driven implementation selection.
5. Measure overhead of the contract layer (in-process vs gRPC) on the operator desktop hot path.

### 1.4. Non-Goals

- Replacing internal logic of either Logistics or Technologies.
- Migrating to event-driven (Kafka, RabbitMQ) communication between plugins.
- Extracting Equipment Registry, MDM, or other contracts — these are scheduled for subsequent iterations on the proven pattern.
- Achieving full distributed-systems guarantees (exactly-once semantics, distributed consensus). The pilot operates in a single trust domain; saga / outbox is out of scope.

---

## 2. Architectural Concept

### 2.1. Contract-Based Plugin Isolation

EDM evolves toward a model where each plugin pair that interacts does so through a versioned contract assembly. The contract:

- Defines the protocol (interfaces, DTOs, error model);
- Is published as an independent NuGet package with its own version;
- Is consumed by exactly one **client plugin** and implemented by exactly one **server plugin** per direction;
- Has at least two implementations available simultaneously (e.g., in-process and gRPC), allowing operators to choose the deployment topology without touching plugin code.

The administrator selects the implementation through configuration (`appsettings.json`). Plugins remain unchanged regardless of whether they communicate in-process or across a network.

### 2.2. Why a Separate Assembly

The contract is **not** part of either plugin. It lives in its own assembly:

```
Microprojects.Edm.Contracts.ProcessExecution
  ├── Interfaces/
  │   └── IProcessExecutionService.cs       (the contract)
  ├── Dto/
  │   ├── StartExecutionRequest.cs
  │   ├── ExecutionResult.cs
  │   └── ...
  ├── Versioning.cs                          (contract version metadata)
  └── ContractTests/                         (reusable test suite)
```

Independent versioning means:

- The contract evolves on its own cadence;
- Breaking changes are visible in the package version (semver);
- Multiple plugin versions can coexist against the same contract;
- Contract tests live with the contract, not with either implementation.

### 2.3. Implementation Selection

At startup, the host reads:

```json
{
  "Edm": {
    "Contracts": {
      "Microprojects.Edm.Contracts.ProcessExecution": {
        "Provider": "InProcess",
        "Endpoint": null
      }
    }
  }
}
```

Possible providers:
- `InProcess` — direct DI binding; Technologies must be loaded in the same host process.
- `Grpc` — bind to a remote endpoint; Technologies is deployed separately.

Administrator UI exposes this selection with a connection-health indicator. Changing the provider requires a host restart (acceptable for pilot scope; hot-swap is explicitly deferred).

### 2.4. Trust and Security

- **In-process**: trust inherited from the hosting process. No additional authentication.
- **gRPC**: mTLS using the existing EDM auth infrastructure (`IClientCertificateProvider`, `GrpcJobExecutor` reused). Caller identity propagated via JWT in metadata.

The contract carries the operator identity as part of the request (`StartExecutionRequest.OperatorId`), independent of transport-level authentication, so audit trails on the Technologies side remain consistent.

---

## 3. Contract Specification

### 3.1. Service Interface

```csharp
namespace Microprojects.Edm.Contracts.ProcessExecution;

public interface IProcessExecutionService
{
    // Command: start an execution. Idempotent on ExecutionId.
    Task<StartExecutionResponse> StartAsync(
        StartExecutionRequest request,
        CancellationToken cancellationToken = default);

    // Query: current status. Cheap, returns lightweight state.
    Task<ExecutionStatus> GetStatusAsync(
        Guid executionId,
        CancellationToken cancellationToken = default);

    // Query: full result once available. Blocks up to `timeout`
    // (long-poll). Returns null if not yet ready.
    Task<ExecutionResult?> WaitForCompletionAsync(
        Guid executionId,
        TimeSpan timeout,
        CancellationToken cancellationToken = default);

    // Command: cancel a running execution. Idempotent.
    Task<CancelExecutionResponse> CancelAsync(
        Guid executionId,
        string reason,
        CancellationToken cancellationToken = default);
}
```

All methods are async and return value types or DTOs — no shared mutable state crosses the contract boundary.

### 3.2. Data Transfer Objects

#### `StartExecutionRequest`

| Field | Type | Description |
|---|---|---|
| `ExecutionId` | `Guid` | Client-assigned execution identifier (UUID v7). Used for idempotency. |
| `ProcessId` | `Guid` | Identifier of the Technology process to run. |
| `OperationId` | `Guid` | Identifier of the specific TO within the process. |
| `OperatorId` | `string` | Identity of the operator initiating the execution. |
| `Inputs` | `IReadOnlyList<ItemPlacement>` | Items loaded into the osnaska, with addresses. |
| `OutputTares` | `IReadOnlyList<TareAssignment>` | Pre-registered output tares by quality grade. |
| `Capacity` | `int?` | Optional override of osnaska capacity (defaults to process configuration). |
| `Metadata` | `IReadOnlyDictionary<string, string>?` | Free-form key-value metadata propagated to audit trail. |

#### `ItemPlacement`

| Field | Type | Description |
|---|---|---|
| `ItemId` | `Guid` | Logistics-owned item identifier. |
| `NomenclatureId` | `Guid` | Nomenclature identifier (snapshot — no live lookup needed). |
| `Quantity` | `decimal` | Quantity allocated to this execution. |
| `Address` | `string` | Address within the osnaska (e.g., "A1", "1.2.3"). |

#### `TareAssignment`

| Field | Type | Description |
|---|---|---|
| `GradeId` | `Guid` | Quality grade for which this tare is the target. |
| `TareId` | `Guid` | Logistics-owned tare identifier. |
| `TareTypeId` | `Guid` | Tare type (snapshot). |

#### `StartExecutionResponse`

| Field | Type | Description |
|---|---|---|
| `Accepted` | `bool` | True if the request was accepted for execution. |
| `RejectionReason` | `string?` | Free-form text if `Accepted == false`. |
| `RejectionCode` | `RejectionCode?` | Enum: `InvalidProcess`, `InvalidInputs`, `CapacityExceeded`, `OperatorUnauthorized`, `Internal`. |
| `EstimatedDuration` | `TimeSpan?` | Best-effort estimate; UI uses for progress display. |

#### `ExecutionStatus`

| Field | Type | Description |
|---|---|---|
| `ExecutionId` | `Guid` | Echo of request id. |
| `State` | `ExecutionState` | Enum: `Pending`, `Running`, `Completed`, `Failed`, `Cancelled`. |
| `StartedAt` | `DateTimeOffset?` | When `Running` was entered. |
| `LastUpdatedAt` | `DateTimeOffset` | Last state transition timestamp. |
| `Progress` | `int?` | 0–100; null if not available. |
| `LastError` | `string?` | Free-form last error message if transient. |

#### `ExecutionResult`

| Field | Type | Description |
|---|---|---|
| `ExecutionId` | `Guid` | Echo of request id. |
| `CompletedAt` | `DateTimeOffset` | Completion timestamp. |
| `State` | `ExecutionState` | Final state: `Completed`, `Failed`, or `Cancelled`. |
| `Outputs` | `IReadOnlyList<OutputAudit>` | Per-item audit result, keyed to input addresses. |
| `Diagnostics` | `IReadOnlyList<Diagnostic>` | Driver/operation log records (warnings, errors). |
| `Errors` | `IReadOnlyList<ExecutionError>` | Structured errors when `State != Completed`. |

#### `OutputAudit`

| Field | Type | Description |
|---|---|---|
| `SourceAddress` | `string` | Address in osnaska (matches `ItemPlacement.Address`). |
| `OutputAddress` | `string?` | Address in target tare if pre-distributed; null if manual. |
| `GradeId` | `Guid?` | Assigned grade; null means "operator must classify manually." |
| `Measurements` | `IReadOnlyDictionary<string, decimal>` | Numeric measurements from the audit (e.g., resistance, dimensions). |
| `Diagnostics` | `string?` | Free-form notes (e.g., "marginal value", "retry suggested"). |

#### `CancelExecutionResponse`

| Field | Type | Description |
|---|---|---|
| `Cancelled` | `bool` | True if cancellation succeeded (or execution was already terminal). |
| `FinalState` | `ExecutionState` | State at cancellation time. |

### 3.3. Idempotency

- `StartAsync` is idempotent on `ExecutionId`: a repeated call with the same id returns the original response (whether accepted or rejected). Retries are safe.
- `GetStatusAsync` and `WaitForCompletionAsync` are naturally idempotent (queries).
- `CancelAsync` is idempotent: cancelling an already-cancelled or completed execution returns the final state without error.

### 3.4. Error Model

All methods throw `ProcessExecutionException` (defined in the contract) for unrecoverable errors. The exception carries:

- `Code` — enum (`NotFound`, `InvalidArgument`, `Conflict`, `Unavailable`, `Internal`);
- `Message` — human-readable;
- `RetryAfter` — optional `TimeSpan` for transient errors.

The gRPC implementation maps these to gRPC status codes; the in-process implementation throws directly.

### 3.5. Versioning

Contract follows **semver**. The assembly's `AssemblyInformationalVersion` is the contract version, independent of plugin versions:

- **Major** — breaking change (method removed, DTO field removed or type changed).
- **Minor** — backwards-compatible addition (new optional field, new method).
- **Patch** — documentation, internal cleanup.

The contract supports a **deprecation window**: a method marked `[Obsolete]` must remain functional for at least one minor version. Plugins consume a specific major version; running multiple major versions simultaneously is not supported in the pilot.

---

## 4. Implementations

### 4.1. In-Process (default)

Located in `Microprojects.Edm.Ui.Technologies.ContractAdapters`:

```csharp
internal sealed class InProcessProcessExecutionService : IProcessExecutionService
{
    private readonly OperationCoordinator _coordinator;  // existing Technologies code
    private readonly IExecutionStore _store;

    public Task<StartExecutionResponse> StartAsync(...)
    {
        // Adapter over existing internal API of Technologies
    }
    // ...
}
```

Registered as a transient or scoped service in DI when `Provider = InProcess`. No serialization, no network. The adapter is thin: it translates contract DTOs into Technologies' internal types and back.

### 4.2. gRPC

Defined in `Microprojects.Edm.Contracts.ProcessExecution.Grpc`:

- `process_execution.proto` — protobuf schema mirroring the DTOs.
- `GrpcProcessExecutionClient` — implements `IProcessExecutionService` by calling a remote gRPC service.
- `GrpcProcessExecutionServer` — exposes Technologies' in-process implementation over gRPC.

When `Provider = Grpc`, Logistics is configured with a remote endpoint and consumes `GrpcProcessExecutionClient`. Technologies runs in its own host with `GrpcProcessExecutionServer` registered. Authentication via mTLS using the existing certificate-provider infrastructure.

### 4.3. Configuration

`appsettings.json` extension:

```json
{
  "Edm": {
    "Contracts": {
      "ProcessExecution": {
        "Provider": "InProcess",       // or "Grpc"
        "GrpcEndpoint": null,           // required when Provider = "Grpc"
        "Timeout": "00:01:00",          // request timeout for gRPC
        "WaitForCompletion": {
          "MaxPollInterval": "00:00:02",
          "DefaultTimeout": "00:05:00"
        }
      }
    }
  }
}
```

### 4.4. Health and Observability

Both implementations expose:

- A health endpoint reachable via the standard `IHealthCheck` mechanism;
- Metrics (request count, request duration, error rate) via `Microsoft.Extensions.Diagnostics.Metrics`;
- Trace propagation via OpenTelemetry — a single trace spans Logistics → Technologies regardless of provider.

---

## 5. Contract Tests

Located in `Microprojects.Edm.Contracts.ProcessExecution.Tests`. Parameterized over the implementation under test. Both in-process and gRPC must pass.

### 5.1. Test Categories

1. **Protocol conformance** — happy path: start, status, wait, result match expected shapes.
2. **Idempotency** — repeated `StartAsync` with the same id returns the same response; repeated `CancelAsync` is safe.
3. **Error mapping** — each `ProcessExecutionException.Code` is correctly produced for the corresponding fault condition (invalid input, missing process, cancelled execution queried, etc.).
4. **Cancellation** — `CancellationToken` correctly aborts in-flight requests on both transports.
5. **Long-poll behaviour** — `WaitForCompletionAsync` blocks for the requested timeout, returns null on timeout, returns result when completion happens during the wait.
6. **Concurrency** — N parallel `StartAsync` calls on distinct execution ids do not interfere; N parallel `GetStatusAsync` are safe.
7. **Identity propagation** — `OperatorId` in the request is correctly recorded in Technologies' audit trail.

### 5.2. Test Harness

A reusable fixture (`ProcessExecutionContractFixture`) is provided in the contract test assembly. Each implementation supplies a factory:

```csharp
[TestClass]
public class InProcessContractTests : ProcessExecutionContractFixture<InProcessFactory> { }

[TestClass]
public class GrpcContractTests : ProcessExecutionContractFixture<GrpcFactory> { }
```

Both inherit the full test suite; no test is duplicated.

---

## 6. Migration Plan

### 6.1. Strangler Sequence

1. Publish `Microprojects.Edm.Contracts.ProcessExecution` v1.0.0 with interfaces and DTOs only (no implementation).
2. Implement `InProcessProcessExecutionService` as an adapter over current Technologies code. Existing internal APIs remain untouched.
3. Identify all Logistics call-sites that currently invoke Technologies directly. Add a feature flag (`Edm:UseContractForExecution`).
4. Convert call-sites to consume `IProcessExecutionService` via DI. Flag-on routes through the contract; flag-off uses the old path.
5. Run both paths in parallel on a staging environment; compare outputs.
6. Switch the flag default to on. Old direct path is deprecated.
7. Implement gRPC reflection: add `GrpcProcessExecutionServer` and `GrpcProcessExecutionClient`. Verify by switching `Provider` to `Grpc` in the staging environment.
8. Remove the deprecated direct path after one release cycle.

### 6.2. Rollback

The feature flag is the rollback mechanism through stages 4–6. After stage 7, rollback requires reverting the provider configuration to `InProcess`. After stage 8, no rollback is possible without re-introducing the old code.

---

## 7. Acceptance Criteria

The pilot is complete when **all** of the following hold:

- [ ] `Microprojects.Edm.Contracts.ProcessExecution` v1.0.0 is published as a NuGet package with full DTO documentation.
- [ ] `InProcessProcessExecutionService` and `GrpcProcessExecutionService` implementations both pass the contract test suite.
- [ ] All identified call-sites in Logistics are routed through `IProcessExecutionService`.
- [ ] The operator desktop's "start execution" workflow functions correctly with both providers.
- [ ] Performance measurement (see §8) is documented in an ADR.
- [ ] An ADR (`docs/adr/001-contract-based-plugin-isolation.md`) is committed, explaining the decision, the choice of uni-directional contract, and lessons learned.
- [ ] The feature flag is removed; the contract path is the only path.

---

## 8. Performance Measurement

### 8.1. Hot Path

The operator desktop "start execution" workflow is the primary hot path. Specifically, the `StartAsync` call between operator action and process-start confirmation.

### 8.2. Targets

- **In-process** overhead vs direct method call: < 1 ms on average.
- **gRPC** overhead vs in-process (single trust domain, localhost): < 10 ms on average, < 30 ms at p99.
- `WaitForCompletionAsync` latency on result-ready event: < 100 ms on either provider.

If the gRPC overhead exceeds the target, mitigation: an `[InProcessOnly]` attribute on hot-path methods, marking them as "callable only when both plugins share a host." The contract still defines them; gRPC implementation refuses with a clear error. This is a fallback, not the design intent.

### 8.3. Measurement Methodology

- Use BenchmarkDotNet to measure the in-process call on a representative request payload.
- Use a load test (k6 or similar) to measure gRPC under concurrent load.
- Record p50, p95, p99, max.
- Compare against the baseline (direct method call) where possible.

---

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| gRPC overhead unacceptable for SignalR-driven UI updates | Medium | Medium | `[InProcessOnly]` escape hatch; or selective use of streaming gRPC for status updates |
| Snapshot model breaks when nomenclature versions change mid-execution | Low | High | Snapshot is taken at `StartAsync` and frozen; subsequent versions of nomenclature do not affect a running execution. Documented in the contract |
| DTO surface grows too large in V1, becomes hard to evolve | Medium | Medium | Reserve fields as `IReadOnlyDictionary<string, string> Metadata` for forward-compatible extension. Reject premature additions to typed fields |
| Two implementations diverge subtly in error mapping | High | Low | Mandatory contract test suite; CI gate that fails if either implementation fails any test |
| Pilot drags on as scope creeps to "make the contract perfect" | Medium | High | Strict acceptance criteria (§7). Defer non-essential improvements (additional methods, streaming) to v1.1 |

---

## 10. Out of Scope

Explicit non-goals for v1.0 of the contract:

- Server-streaming gRPC for status updates (deferred to v1.1).
- Event-bus integration (Kafka, RabbitMQ) — deferred indefinitely.
- Hot-swap of providers at runtime — restart required.
- Multi-tenant execution isolation — single trust domain assumed.
- Backward compatibility with pre-contract Logistics versions — pilot assumes coordinated upgrade.

---

## 11. Effort Estimate

| Activity | Estimate |
|---|---|
| Contract design and DTO definition | 0,15 person-month |
| In-process implementation (adapter) | 0,25 person-month |
| Logistics call-site migration | 0,25 person-month |
| gRPC implementation | 0,20 person-month |
| Contract test suite + harness | 0,15 person-month |
| Performance measurement + ADR | 0,10 person-month |
| Buffer (refactoring, review, documentation) | 0,15 person-month |
| **Total** | **≈ 1,25 person-month (1,0 – 1,5 range)** |

This replaces the earlier 1,5 – 2,5 person-month estimate from the v2.1 roadmap. The reduction reflects the simpler uni-directional model.

---

## 12. Deliverables

1. `Microprojects.Edm.Contracts.ProcessExecution` — assembly with interfaces, DTOs, contract version metadata.
2. `Microprojects.Edm.Contracts.ProcessExecution.Grpc` — gRPC client/server implementations and proto files.
3. `Microprojects.Edm.Contracts.ProcessExecution.Tests` — contract test suite + parameterized fixture.
4. Adapter inside `Microprojects.Edm.Ui.Technologies` — `InProcessProcessExecutionService`.
5. Modified `Microprojects.Edm.Ui.Logistics` — all relevant call-sites consume `IProcessExecutionService`.
6. `docs/adr/001-contract-based-plugin-isolation.md` — architecture decision record.
7. Performance report (markdown or PDF) attached to the ADR.
8. Updated `appsettings.json` documentation describing the `Edm:Contracts:ProcessExecution` section.

---

## 13. Open Questions for Discussion

These should be resolved before implementation begins:

1. **Item.Quantity types** — current `Item.Quantity` is `decimal`. Confirm the gRPC proto representation (`google.protobuf.StringValue` for exact decimal, or `double` for performance). Recommendation: string-encoded decimal for correctness.
2. **OutputAudit measurements** — should the dictionary key be free-form, or constrained to a registered set of measurement types? Recommendation: free-form for v1, with a documented convention.
3. **Grade assignment timing** — when `OutputAudit.GradeId == null`, operator classifies manually. Should the contract carry a hint about which grades are valid for this output? Recommendation: yes, add `IReadOnlyList<Guid> SuggestedGradeIds` to `OutputAudit`.
4. **Cancellation semantics** — should `CancelAsync` allow forced cancellation that aborts hardware in mid-state, or only graceful? Recommendation: graceful only in v1; forced cancellation deferred.
5. **Network failure during gRPC `WaitForCompletionAsync`** — should Logistics retry transparently, or surface the failure? Recommendation: surface — the caller has enough information to retry with the same `ExecutionId`.
