using System;
using Microprojects.Edm.Ui.Logistics.Models;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedDirectoryStructure : Migration
    {
        // Stable type-root ids live in WellKnownDirectoryIds — single point of
        // truth shared with the runtime services. Example-entry ids are local
        // to this migration: they exist only as seed payload.
        private static Guid RootId            => WellKnownDirectoryIds.Root;
        private static Guid NomenclaturesId   => WellKnownDirectoryIds.Nomenclatures;
        private static Guid ManufacturingId   => WellKnownDirectoryIds.Manufacturing;
        private static Guid TechnologyId      => WellKnownDirectoryIds.Technology;
        private static Guid OperationsId      => WellKnownDirectoryIds.Operations;
        private static Guid SpecificationsId  => WellKnownDirectoryIds.Specifications;
        private static Guid TareTypesId       => WellKnownDirectoryIds.TareTypes;

        private static readonly Guid NomenclatureExampleId  = new("42ddf5c4-9655-867d-8d8b-019dd417d01a");
        private static readonly Guid ManufactureProcessId   = new("6bcbfcbf-70c7-8042-8d90-019dd417d01a");
        private static readonly Guid TechnologyProcessId    = new("ba187e10-c632-81a3-8d91-019dd417d01a");
        private static readonly Guid OperationProcessId     = new("5330e2c4-6995-82b9-8d92-019dd417d01a");
        private static readonly Guid SpecificationExampleId = new("fbb0a4f3-c727-879e-8d94-019dd417d01a");
        private static readonly Guid TareTypeExampleId      = new("e359ab5d-8be0-8c9e-8d96-019dd417d01a");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($@"
-- ===== Root =====
IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{RootId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{RootId}', 'Directory', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Directories] WHERE [Id] = '{RootId}')
    INSERT INTO [Directories] ([Id], [Name], [DirectoryId])
    VALUES ('{RootId}', 'Root', NULL);

-- ===== Nomenclatures root + example =====
IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{NomenclaturesId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{NomenclaturesId}', 'Directory', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Directories] WHERE [Id] = '{NomenclaturesId}')
    INSERT INTO [Directories] ([Id], [Name], [DirectoryId])
    VALUES ('{NomenclaturesId}', 'Nomenclatures', '{RootId}');

IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{NomenclatureExampleId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{NomenclatureExampleId}', 'Nomenclature', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Nomenclatures] WHERE [Id] = '{NomenclatureExampleId}')
    INSERT INTO [Nomenclatures] ([Id], [Name], [DirectoryId], [Category], [Countable], [DefaultTareTypeId])
    VALUES ('{NomenclatureExampleId}', 'Nomenclature (example)', '{NomenclaturesId}', 0, 1, NULL);

-- ===== Manufacturing root + example process =====
IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{ManufacturingId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{ManufacturingId}', 'Directory', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Directories] WHERE [Id] = '{ManufacturingId}')
    INSERT INTO [Directories] ([Id], [Name], [DirectoryId])
    VALUES ('{ManufacturingId}', 'Manufacturing', '{RootId}');

IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{ManufactureProcessId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{ManufactureProcessId}', 'Process', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Processes] WHERE [Id] = '{ManufactureProcessId}')
    INSERT INTO [Processes] ([Id], [Name], [DirectoryId], [Kind], [NomenclatureId])
    VALUES ('{ManufactureProcessId}', 'Manufacturing (example)', '{ManufacturingId}', 0, NULL);

-- ===== Technology root + example process =====
IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{TechnologyId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{TechnologyId}', 'Directory', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Directories] WHERE [Id] = '{TechnologyId}')
    INSERT INTO [Directories] ([Id], [Name], [DirectoryId])
    VALUES ('{TechnologyId}', 'Technology', '{RootId}');

IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{TechnologyProcessId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{TechnologyProcessId}', 'Process', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Processes] WHERE [Id] = '{TechnologyProcessId}')
    INSERT INTO [Processes] ([Id], [Name], [DirectoryId], [Kind], [NomenclatureId])
    VALUES ('{TechnologyProcessId}', 'Technology (example)', '{TechnologyId}', 1, NULL);

-- ===== Operations root + example process =====
IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{OperationsId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{OperationsId}', 'Directory', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Directories] WHERE [Id] = '{OperationsId}')
    INSERT INTO [Directories] ([Id], [Name], [DirectoryId])
    VALUES ('{OperationsId}', 'Operations', '{RootId}');

IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{OperationProcessId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{OperationProcessId}', 'Process', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Processes] WHERE [Id] = '{OperationProcessId}')
    INSERT INTO [Processes] ([Id], [Name], [DirectoryId], [Kind], [NomenclatureId])
    VALUES ('{OperationProcessId}', 'Operation (example)', '{OperationsId}', 2, NULL);

-- ===== Specifications root + example (linked to Manufacturing process) =====
IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{SpecificationsId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{SpecificationsId}', 'Directory', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Directories] WHERE [Id] = '{SpecificationsId}')
    INSERT INTO [Directories] ([Id], [Name], [DirectoryId])
    VALUES ('{SpecificationsId}', 'Specifications', '{RootId}');

IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{SpecificationExampleId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{SpecificationExampleId}', 'Specification', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Specifications] WHERE [Id] = '{SpecificationExampleId}')
    INSERT INTO [Specifications] ([Id], [Name], [DirectoryId], [Active], [ProcessId])
    VALUES ('{SpecificationExampleId}', 'Specification (example)', '{SpecificationsId}', 0, '{ManufactureProcessId}');

-- ===== TareTypes root + example =====
IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{TareTypesId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{TareTypesId}', 'Directory', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [Directories] WHERE [Id] = '{TareTypesId}')
    INSERT INTO [Directories] ([Id], [Name], [DirectoryId])
    VALUES ('{TareTypesId}', 'TareTypes', '{RootId}');

IF NOT EXISTS (SELECT 1 FROM [Meta] WHERE [Id] = '{TareTypeExampleId}')
    INSERT INTO [Meta] ([Id], [Metatype], [Owner], [Groups], [Created])
    VALUES ('{TareTypeExampleId}', 'TareType', 'system', '[]', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM [TareTypes] WHERE [Id] = '{TareTypeExampleId}')
    INSERT INTO [TareTypes] ([Id], [Name], [DirectoryId], [Units], [Capacity], [Countable], [SizeX], [SizeY], [SizeZ])
    VALUES ('{TareTypeExampleId}', 'TareType (example)', '{TareTypesId}', '', 1, 1, NULL, NULL, NULL);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($@"
-- Delete child entities before their parent directories, and Meta last.
DELETE FROM [Specifications] WHERE [Id] = '{SpecificationExampleId}';
DELETE FROM [Processes]      WHERE [Id] IN ('{ManufactureProcessId}', '{TechnologyProcessId}', '{OperationProcessId}');
DELETE FROM [Nomenclatures]  WHERE [Id] = '{NomenclatureExampleId}';
DELETE FROM [TareTypes]      WHERE [Id] = '{TareTypeExampleId}';

-- Type roots are siblings under Root; delete them, then Root.
DELETE FROM [Directories] WHERE [Id] IN (
    '{NomenclaturesId}', '{ManufacturingId}', '{TechnologyId}', '{OperationsId}',
    '{SpecificationsId}', '{TareTypesId}'
);
DELETE FROM [Directories] WHERE [Id] = '{RootId}';

DELETE FROM [Meta] WHERE [Id] IN (
    '{RootId}',
    '{NomenclaturesId}', '{NomenclatureExampleId}',
    '{ManufacturingId}', '{TechnologyId}', '{OperationsId}',
    '{ManufactureProcessId}', '{TechnologyProcessId}', '{OperationProcessId}',
    '{SpecificationsId}', '{SpecificationExampleId}',
    '{TareTypesId}', '{TareTypeExampleId}'
);
");
        }
    }
}
