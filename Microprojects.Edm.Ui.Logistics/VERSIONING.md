# Schema entity versioning

## Problem

`TareType`, `Nomenclature`, and similar schema-defining entities can be edited after live items reference them. Today changes propagate live, leaving orphaned items inconsistent with the current schema — e.g. a `Quantity = 20`, no-`Address` item in an addressed-countable tare type that originally was bulk.

## Approach

Auto-fork on save: when a non-trivial change is saved to a forkable entity with any reference, clone the entity (reuse the existing Copy path), apply the edit to the clone, link the clone to the original via `Meta.OriginId`, and stamp `Meta.Completed = now` on the original. Old references stay valid against the frozen original; new operations pick up the clone via `Meta.Completed`-filtered pickers.

A user confirmation dialog ("This will create a new version…") gates the fork.

Trivial edits (`Name`, `Description`) mutate in place — the "trivial" allow-list is explicit per entity.

## Decisions

| Decision | Rationale |
|---|---|
| Forkable: `TareType`, `Nomenclature`, `Process`. | Schema entities. Transactional rows (`Item`, `Tare`, `Order`) have their own lifecycles; forking them on edit would cause endless churn. |
| `Specification` and `SpecificationNomenclature` don't have their own auto-fork — they're treated as data inside their parent `Process`. Substantive edits to a spec route through the parent's fork rule. | The UI does not surface multi-spec-per-Process today and isn't expected to, so `Specification.Active` doesn't function as a versioning primitive in practice (every spec under an active Process is *the* spec). Treating Process as the unit of versioning means spec edits fork the parent (only when the Process has live references; otherwise mutate in place). Process's Copy path duplicates child `Specification` and `SpecificationNomenclature` rows under the new parent, so the new Process has its own editable spec set while the old (frozen) Process retains its originals. |
| Fork trigger: any reference, active or historical. | Historical views must see the entity as it was when the referencing row lived. Freezing only on active references breaks history consistency. |
| `OriginId` lives on `Meta`, not on each entity. | Row-lifecycle metadata, sits naturally next to `Created`/`Modified`/`Deleted`/`Completed`. One column serves all forkable types. Existing `Meta`-driven mappers and the `History` table propagate it for free. Type homogeneity enforced at write time via `Meta.Metatype` (already set in `ServiceBase.Save`). |
| UI: "outdated" indicator on rows where `Meta.Completed != null`; no revision number shown. | Reuses the existing `Meta.Completed` field — no chain-depth query, no per-request DB roundtrip. The `OriginId` chain remains walkable on demand if a future "show all versions" feature wants it. |
| No transitive forks: forking N does not fork rows that reference N. | Each entity owns its own versioning. References stay frozen on the old N until the referencing entity is itself edited. Cascading would explode the DB on a single config change, and would be semantically wrong — most references are intentional snapshots (a `Specification` defined against the old `Countable` flag, an `Order`'s items produced under the old shape). |
| Exception: pure-configuration junction rows (`NomenclatureTareType` allowed-list) re-point from the old version to the fork. | They aren't `IWithMeta` and aren't snapshots — they describe "current capability," which belongs with the active version, not the frozen one. `Nomenclature.DefaultTareTypeId` is a column on `Nomenclature` itself, so the Copy path carries it across naturally. |
| Reuse the existing Detail-toolbar Copy button path. | Auto-fork is a programmatic invocation of the same logic, plus the `OriginId`/`Completed` stamps and the junction-row re-point. |

## Implementation outline

1. Add `OriginId` (`Guid?`) to `Meta`; EF migration + model snapshot update.
2. Override `Save` in `TareTypeService`, `NomenclatureService`, and (later) `ProcessService` — currently neither `NomenclatureService` nor `ProcessService` has a `Save` override. Diff against the persisted row, and if any reference exists and the change isn't on the trivial allow-list, route through the fork path. Reuse the Copy code path; set `Meta.OriginId` on the clone, stamp `Meta.Completed = now` on the original. For `Process`, the Copy path must duplicate the child `Specification` and `SpecificationNomenclature` rows under the new parent.
3. View-model layer: expose `Meta.Completed` on the affected entity view models. Most of them don't surface it today — only `OrderViewModel` does, via `_WebModelsProfile.cs:92`. Add equivalents on `TareTypeViewModel` and `NomenclatureViewModel` (and any future forkable types) so the frontend can render the "outdated" indicator off a single field.
4. Frontend: pre-save confirmation dialog when the controller indicates a fork would occur; render an "outdated" indicator in detail headers when `Meta.Completed != null`.
5. One-off cleanup of the existing `Q = 20` orphan row (`id e495b980-…`) — needs manual data fix; can't be auto-migrated to a consistent state.
6. Independent of versioning but in the same fix: address-less items in addressed-countable tares should not count as occupied slots in `tareSummary` (`Ui/src/components/tare/TareItemsPanel.tsx:50-57`). Surface them as orphans instead of inflating the slot count.

## Future tasks

- **History: store diffs instead of full snapshots.** `ServiceBase.Save` currently serializes the entire entity into `History.JsonValue` on every save (`Services/ServiceBase.cs:265-271`). With versioning landed, replace with a JSON Patch diff against the previous `History` row (or against the chain-head when crossing a fork boundary). Reduces storage growth on long-lived entities and makes history easier to read.
- **Make `Nomenclature` obligatory on Technology process creation.** A `Process` of kind `Technology` represents a transformation that consumes inputs and produces an output of a specific nomenclature; without it the spec-driven allocation has nothing to bind to. Today `Process.NomenclatureId` is nullable and the create form does not enforce it for `Kind == Technology`. Add server-side validation (reject Technology saves with `NomenclatureId == null`) plus a required-field marker in the Process editor.
- **Guard `Specification.Active` toggling and in-place spec edits when the parent Process has live references.** Today nothing prevents a user from deactivating an Active spec — or editing a spec's nomenclature quantity — on a Process that already has Draft orders allocated against it, which would silently break those allocations. Once auto-fork is in place this is largely subsumed (the change forks the Process), but the explicit guard is still worth keeping for codepaths that bypass the fork (direct DB edits, future API endpoints). Mirrors the `hasPending` check that `OrderService.CompleteOrder` already does (`OrderService.cs:750-757`).
