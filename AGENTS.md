# AGENTS.md

This repository is an **ASP.NET Core platform** designed to host UI plugins as DLL libraries. Most plugins are Single Page Applications (SPA) built with **React**.

## 🝗︝ Architecture & Project Structure
- **Core Platform:** ASP.NET Core backend (`Optosense.Edm.Core`, `Optosense.Edm.WebApi`).
- **Plugins:** Modular features implemented as C# projects (`Optosense.Edm.Profiles.*`) with embedded SPA UIs (typically in a `Ui/` or `MuxDriverUi/` folder).
- **Persistence:** EF Core with PostgreSQL/Npgsql. Uses `jsonb` column types for flexible parameter storage (e.g., in `Record` entity).
- **Frontend:** React-based SPAs using MUI (Material UI), Kendo React, and Redux Toolkit. Modern modules use **Rsbuild** and **Biome**.

## 🛠︝ Build, Lint & Test Commands

### Backend (.NET 10.0)
- **Build All:** `dotnet build Edm.slnx`
- **Build Project:** `dotnet build <path-to-csproj>`
- **Run Tests:** `dotnet test`
- **Single Test:** `dotnet test --filter Name~TestMethodName`
- **Format:** `dotnet format`

### Frontend (React / SPAs)
Commands should be run within the specific UI directory (e.g., `Optosense.Edm.Profiles.Board/Ui`).
- **Install:** `npm install`
- **Development:** `npm run dev` (or `npm start` for older modules)
- **Build:** `npm run build`
- **Lint & Format (Biome):** `npm run check` (runs `biome check --write`) or `npm run format`
- **Run Tests (Jest):** `npm run test`
- **Single Test (Jest):** `npm test -- -t "test name"` or `npm test -- <filename>.test.js`

## 🎨 Code Style Guidelines

### C# / Backend
- **Naming:** 
  - `PascalCase` for classes, methods, namespaces, and public properties.
  - `_camelCase` for private fields (e.g., `private IRemoteJobs _commands;`).
  - `camelCase` for local variables and parameters.
- **Async/Await:** Use `async`/`await` for all I/O bound operations (database, network).
- **Error Handling:** 
  - Use `EdmException` for business-level errors that should be reported to the user.
  - Use standard `ArgumentNullException.ThrowIfNull()` or `ArgumentException` for parameter validation.
- **Persistence & EF Core:** 
  - Use `AsNoTracking()` for read-only queries to improve performance.
  - Use `Include()` and `ThenInclude()` for eager loading of related entities.
  - Soft delete is implemented via the `IsActive` property on entities inheriting from `TypeObject`.
- **Formatting:** Braces on new lines. Braces are mandatory even for single-line blocks (e.g., `if`, `foreach`).

### JavaScript / TypeScript / React
- **Component Style:** Use functional components and hooks (e.g., `useState`, `useEffect`, `useMemo`).
- **Indentation:** 4 spaces (enforced by Biome configuration).
- **Quotes:** Single quotes `'` for strings.
- **Semicolons:** Avoid semicolons unless strictly necessary ("asNeeded").
- **Imports Order:**
  1. React core, hooks, and built-in components.
  2. External libraries (e.g., `@mui/material`, `react-router-dom`, `@reduxjs/toolkit`).
  3. Internal shared components, hooks, and utilities.
  4. Styles (Scss/Css).
- **State Management:** 
  - Use **Redux Toolkit** for complex global state.
  - Use **ApiContext** to provide API base URLs to components.
  - Use `usePluginData` hook from `@microprojects/react-utils` for plugin-specific data.

## 🔌 Plugin Development
Plugins are categorized into three main types, each serving a distinct purpose in the EDM ecosystem.

### 1. Profile Plugins
- **Purpose:** Define the schema and business logic for device settings and configuration profiles.
- **Key Responsibilities:**
  - Define setting types (`GetSettingType`).
  - Extract parameter placeholders from profile JSON (`GetParameters`).
- **Implementation:** Inherit from `ProfilePluginBase` and use `[ProfilePlugin]` attribute.
- **UI:** Usually contains a React-based profile editor.

### 2. Driver Plugins
- **Purpose:** Bridge the gap between profiles and hardware/protocols (e.g., OPC UA, REST, Serial).
- **Key Responsibilities:**
  - Map configuration profiles and runtime parameters to execution plans (`GetPlan` or `GetAsyncPlan`).
  - Create `IDeviceDriver` instances for direct hardware interaction.
- **Implementation:** Inherit from `DriverPluginBase`. Often implement `IAsyncPlanProvider`.
- **Association:** Linked to a specific Profile Plugin via `DriverPluginAttribute.Profile`.
- **UI:** Used for low-level diagnostics, manual command terminals, and driver-specific troubleshooting tools.

### 3. Operation Plugins
- **Purpose:** Provide context-aware monitoring for specific process instances (e.g., hardware tests).
- **Key Responsibilities:**
  - Visualize real-time data and operation status.
  - Often rely on SignalR data linked to a specific `OperationId`.
- **Implementation:** Inherit from `PluginBase` and implement `IOperationPlugin`. Use `[OperationPlugin]` attribute.
- **Examples:** `Optogen`, `Test`.

### 4. Application Plugins
- **Purpose:** Provide top-level business modules and systemic dashboards.
- **Key Responsibilities:**
  - System-wide features (inventory, administration, diagnostics).
  - Operate independently of specific process instances.
- **Implementation:** Inherit from `PluginBase` and implement `IApplicationPlugin`. Use `[ApplicationPlugin]` attribute.
- **Examples:** `Logistics`, `Main UI` (EDM), `Host Console`.

### Plugin Scaffolding Example
```csharp
[ProfilePlugin(
    Guid = "8E33F54D-D817-44C4-B2ED-1F8FD957CCD6", 
    Name = "MyPlugin", 
    SpaPath = "Ui/build", 
    UiRoot = "profiles/myplugin")]
public class MyPlugin : ProfilePluginBase { ... }
```
- **SpaPath:** Must point to the directory containing the production build of the SPA.
- **UiRoot:** The base URL path where the plugin's UI is served.

## 📝 Repository Conventions
- **New Features:** Create a new plugin project (`Optosense.Edm.Profiles.<Name>`) if the feature is independent.
- **Naming:** Follow the `Optosense.Edm.*` or `Microprojects.Edm.*` naming convention for projects and namespaces.
- **Commits:** Keep commits atomic and descriptive. 
- **Dependencies:** Verify if a library (NuGet or NPM) is already used in other plugins before adding a new one to keep the bundle size and dependency graph clean.
- **Entities:** Inherit from `DomainObject` (for base entities with `Id`) or `TypeObject` (for entities requiring `Name`, `Description`, and soft delete support).
