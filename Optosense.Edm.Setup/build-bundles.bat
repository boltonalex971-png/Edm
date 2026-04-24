@echo off
REM Builds self-contained EF migration bundles into each project's bin folder
REM so the Setup project (vdproj) can deploy them next to Optosense.Edm.WebApi.exe.
REM Each bundle reads __EFMigrationsHistory at runtime and applies only the
REM migrations missing on the target DB.
REM
REM Re-run this whenever migrations change, before rebuilding the Setup project.

setlocal
set SCRIPT_DIR=%~dp0
set REPO_ROOT=%SCRIPT_DIR%..
set RID=win-x64
set TFM=net10.0
set CONFIG=Debug
set EDM_OUT=%REPO_ROOT%\Optosense.Edm.DataAccess\bin\%CONFIG%\%TFM%\Optosense.Edm.DataAccess.efbundle.exe
set LOGISTICS_OUT=%REPO_ROOT%\Microprojects.Edm.Ui.Logistics\bin\%CONFIG%\%TFM%\Microprojects.Edm.Ui.Logistics.efbundle.exe

REM Connection strings below are only used at *design time* by EF tools to
REM resolve the DbContext (e.g. for LogisticsContextFactory). They are NOT
REM baked into the bundles -- the real connection string is passed at install
REM time by Microprojects.Edm.Install.exe via --connection.
set DESIGN_TIME_CONN=Data Source=.\SQLEXPRESS;Initial Catalog=optosense_edm;Integrated Security=SSPI;Encrypt=no;TrustServerCertificate=no;
set DESIGN_TIME_LOGISTICS_CONN=Data Source=.\SQLEXPRESS;Initial Catalog=optosense_logistics;Integrated Security=SSPI;Encrypt=no;TrustServerCertificate=no;

echo === Building Optosense.Edm.DataAccess.efbundle.exe ===
pushd "%REPO_ROOT%\Optosense.Edm.DataAccess"
dotnet ef migrations bundle ^
  --startup-project "%REPO_ROOT%\Optosense.Edm.WebApi" ^
  --context EdmContext ^
  --self-contained -r %RID% ^
  --output "%EDM_OUT%" ^
  --force
if errorlevel 1 (popd & echo Failed to build Edm bundle & exit /b 1)
popd

echo === Building Microprojects.Edm.Ui.Logistics.efbundle.exe ===
pushd "%REPO_ROOT%\Microprojects.Edm.Ui.Logistics"
dotnet ef migrations bundle ^
  --context LogisticsContext ^
  --self-contained -r %RID% ^
  --output "%LOGISTICS_OUT%" ^
  --force ^
  -- --connection-string "%DESIGN_TIME_LOGISTICS_CONN%"
if errorlevel 1 (popd & echo Failed to build Logistics bundle & exit /b 1)
popd

echo.
echo Bundles produced:
echo   %EDM_OUT%
echo   %LOGISTICS_OUT%
endlocal
