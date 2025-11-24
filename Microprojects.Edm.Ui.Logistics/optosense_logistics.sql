IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Changelog] (
    [Id] uniqueidentifier NOT NULL,
    [ObjectId] uniqueidentifier NOT NULL,
    [Author] nvarchar(max) NOT NULL,
    [JsonValue] nvarchar(max) NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    CONSTRAINT [PK_Changelog] PRIMARY KEY ([Id])
);

CREATE TABLE [Directories] (
    [Id] uniqueidentifier NOT NULL,
    [ParentId] uniqueidentifier NULL,
    [ObjectId] uniqueidentifier NULL,
    [EntityType] nvarchar(max) NOT NULL,
    [IsPublic] bit NOT NULL,
    [Owner] nvarchar(max) NOT NULL,
    [Group] nvarchar(max) NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    CONSTRAINT [PK_Directories] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Directories_Directories_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [Directories] ([Id])
);

CREATE TABLE [Meta] (
    [Id] uniqueidentifier NOT NULL,
    [Metatype] nvarchar(max) NOT NULL,
    [JsonValue] nvarchar(max) NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    CONSTRAINT [PK_Meta] PRIMARY KEY ([Id])
);

CREATE TABLE [Nomenclatures] (
    [Id] uniqueidentifier NOT NULL,
    [Category] int NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    CONSTRAINT [PK_Nomenclatures] PRIMARY KEY ([Id])
);

CREATE TABLE [Processes] (
    [Id] uniqueidentifier NOT NULL,
    [Kind] int NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    CONSTRAINT [PK_Processes] PRIMARY KEY ([Id])
);

CREATE TABLE [ProcessTrees] (
    [Id] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_ProcessTrees] PRIMARY KEY ([Id])
);

CREATE TABLE [Specifications] (
    [Id] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_Specifications] PRIMARY KEY ([Id])
);

CREATE TABLE [TareTypes] (
    [Id] uniqueidentifier NOT NULL,
    [Unit] nvarchar(max) NOT NULL,
    [Countable] bit NOT NULL,
    [Dimensions] int NOT NULL,
    [Capacity] int NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    CONSTRAINT [PK_TareTypes] PRIMARY KEY ([Id])
);

CREATE TABLE [Tasks] (
    [Id] uniqueidentifier NOT NULL,
    [NomenclatureId] uniqueidentifier NOT NULL,
    [From] datetime2 NOT NULL,
    [To] datetime2 NOT NULL,
    CONSTRAINT [PK_Tasks] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Tasks_Nomenclatures_NomenclatureId] FOREIGN KEY ([NomenclatureId]) REFERENCES [Nomenclatures] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [SpecificationNomenclatures] (
    [Id] uniqueidentifier NOT NULL,
    [SpecificationId] uniqueidentifier NOT NULL,
    [NomenclatureId] uniqueidentifier NOT NULL,
    [Quantity] int NOT NULL,
    CONSTRAINT [PK_SpecificationNomenclatures] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SpecificationNomenclatures_Nomenclatures_NomenclatureId] FOREIGN KEY ([NomenclatureId]) REFERENCES [Nomenclatures] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_SpecificationNomenclatures_Specifications_SpecificationId] FOREIGN KEY ([SpecificationId]) REFERENCES [Specifications] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [NomenclatureTypes] (
    [Id] uniqueidentifier NOT NULL,
    [TareTypeId] uniqueidentifier NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NULL,
    CONSTRAINT [PK_NomenclatureTypes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_NomenclatureTypes_TareTypes_TareTypeId] FOREIGN KEY ([TareTypeId]) REFERENCES [TareTypes] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Tares] (
    [Id] uniqueidentifier NOT NULL,
    [TareTypeId] uniqueidentifier NOT NULL,
    [Barcode] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Tares] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Tares_TareTypes_TareTypeId] FOREIGN KEY ([TareTypeId]) REFERENCES [TareTypes] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_Directories_ParentId] ON [Directories] ([ParentId]);

CREATE INDEX [IX_NomenclatureTypes_TareTypeId] ON [NomenclatureTypes] ([TareTypeId]);

CREATE INDEX [IX_SpecificationNomenclatures_NomenclatureId] ON [SpecificationNomenclatures] ([NomenclatureId]);

CREATE INDEX [IX_SpecificationNomenclatures_SpecificationId] ON [SpecificationNomenclatures] ([SpecificationId]);

CREATE INDEX [IX_Tares_TareTypeId] ON [Tares] ([TareTypeId]);

CREATE INDEX [IX_Tasks_NomenclatureId] ON [Tasks] ([NomenclatureId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250405171658_Initial', N'9.0.2');

ALTER TABLE [Directories] DROP CONSTRAINT [FK_Directories_Directories_ParentId];

DECLARE @var sysname;
SELECT @var = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Directories]') AND [c].[name] = N'EntityType');
IF @var IS NOT NULL EXEC(N'ALTER TABLE [Directories] DROP CONSTRAINT [' + @var + '];');
ALTER TABLE [Directories] DROP COLUMN [EntityType];

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Directories]') AND [c].[name] = N'Group');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Directories] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [Directories] DROP COLUMN [Group];

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Directories]') AND [c].[name] = N'IsPublic');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [Directories] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [Directories] DROP COLUMN [IsPublic];

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Directories]') AND [c].[name] = N'ObjectId');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [Directories] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [Directories] DROP COLUMN [ObjectId];

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Directories]') AND [c].[name] = N'Owner');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [Directories] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [Directories] DROP COLUMN [Owner];

EXEC sp_rename N'[Meta].[Timestamp]', N'Created', 'COLUMN';

EXEC sp_rename N'[Meta].[JsonValue]', N'Owner', 'COLUMN';

EXEC sp_rename N'[Directories].[ParentId]', N'DirectoryId', 'COLUMN';

EXEC sp_rename N'[Directories].[IX_Directories_ParentId]', N'IX_Directories_DirectoryId', 'INDEX';

ALTER TABLE [TareTypes] ADD [DirectoryId] uniqueidentifier NULL;

ALTER TABLE [Processes] ADD [DirectoryId] uniqueidentifier NULL;

ALTER TABLE [NomenclatureTypes] ADD [DirectoryId] uniqueidentifier NULL;

ALTER TABLE [Nomenclatures] ADD [DirectoryId] uniqueidentifier NULL;

ALTER TABLE [Meta] ADD [Deleted] datetime2 NULL;

ALTER TABLE [Meta] ADD [Groups] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Meta] ADD [Modified] datetime2 NULL;

CREATE TABLE [History] (
    [Id] uniqueidentifier NOT NULL,
    [MetaId] uniqueidentifier NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    [JsonValue] nvarchar(max) NOT NULL,
    [Author] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_History] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_History_Meta_MetaId] FOREIGN KEY ([MetaId]) REFERENCES [Meta] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_TareTypes_DirectoryId] ON [TareTypes] ([DirectoryId]);

CREATE INDEX [IX_Processes_DirectoryId] ON [Processes] ([DirectoryId]);

CREATE INDEX [IX_NomenclatureTypes_DirectoryId] ON [NomenclatureTypes] ([DirectoryId]);

CREATE INDEX [IX_Nomenclatures_DirectoryId] ON [Nomenclatures] ([DirectoryId]);

CREATE INDEX [IX_History_MetaId] ON [History] ([MetaId]);

ALTER TABLE [Directories] ADD CONSTRAINT [FK_Directories_Directories_DirectoryId] FOREIGN KEY ([DirectoryId]) REFERENCES [Directories] ([Id]);

ALTER TABLE [Directories] ADD CONSTRAINT [FK_Directories_Meta_Id] FOREIGN KEY ([Id]) REFERENCES [Meta] ([Id]);

ALTER TABLE [Nomenclatures] ADD CONSTRAINT [FK_Nomenclatures_Directories_DirectoryId] FOREIGN KEY ([DirectoryId]) REFERENCES [Directories] ([Id]);

ALTER TABLE [Nomenclatures] ADD CONSTRAINT [FK_Nomenclatures_Meta_Id] FOREIGN KEY ([Id]) REFERENCES [Meta] ([Id]);

ALTER TABLE [NomenclatureTypes] ADD CONSTRAINT [FK_NomenclatureTypes_Directories_DirectoryId] FOREIGN KEY ([DirectoryId]) REFERENCES [Directories] ([Id]);

ALTER TABLE [NomenclatureTypes] ADD CONSTRAINT [FK_NomenclatureTypes_Meta_Id] FOREIGN KEY ([Id]) REFERENCES [Meta] ([Id]);

ALTER TABLE [Processes] ADD CONSTRAINT [FK_Processes_Directories_DirectoryId] FOREIGN KEY ([DirectoryId]) REFERENCES [Directories] ([Id]);

ALTER TABLE [Processes] ADD CONSTRAINT [FK_Processes_Meta_Id] FOREIGN KEY ([Id]) REFERENCES [Meta] ([Id]);

ALTER TABLE [TareTypes] ADD CONSTRAINT [FK_TareTypes_Directories_DirectoryId] FOREIGN KEY ([DirectoryId]) REFERENCES [Directories] ([Id]);

ALTER TABLE [TareTypes] ADD CONSTRAINT [FK_TareTypes_Meta_Id] FOREIGN KEY ([Id]) REFERENCES [Meta] ([Id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250411081455_DirectoryAndMeta', N'9.0.2');

DROP TABLE [ProcessTrees];

CREATE TABLE [SubProcesses] (
    [Id] uniqueidentifier NOT NULL,
    [ProcessId] uniqueidentifier NOT NULL,
    [LinkedProcessId] uniqueidentifier NOT NULL,
    [Order] int NOT NULL,
    CONSTRAINT [PK_SubProcesses] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SubProcesses_Processes_LinkedProcessId] FOREIGN KEY ([LinkedProcessId]) REFERENCES [Processes] ([Id]),
    CONSTRAINT [FK_SubProcesses_Processes_ProcessId] FOREIGN KEY ([ProcessId]) REFERENCES [Processes] ([Id])
);

CREATE INDEX [IX_SubProcesses_LinkedProcessId] ON [SubProcesses] ([LinkedProcessId]);

CREATE INDEX [IX_SubProcesses_ProcessId] ON [SubProcesses] ([ProcessId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250415145335_SubProcesses', N'9.0.2');

DROP TABLE [NomenclatureTypes];

ALTER TABLE [Nomenclatures] ADD [DefaultTareTypeId] uniqueidentifier NULL;

CREATE TABLE [Items] (
    [Id] uniqueidentifier NOT NULL,
    [Shipment] nvarchar(max) NULL,
    [ShipmentExternalId] nvarchar(max) NULL,
    [SerialNo] nvarchar(max) NULL,
    [Barcode] nvarchar(max) NULL,
    [Quantity] int NOT NULL,
    [NomenclatureId] uniqueidentifier NOT NULL,
    [TareId] uniqueidentifier NULL,
    [OriginId] uniqueidentifier NULL,
    CONSTRAINT [PK_Items] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Items_Items_OriginId] FOREIGN KEY ([OriginId]) REFERENCES [Items] ([Id]),
    CONSTRAINT [FK_Items_Nomenclatures_NomenclatureId] FOREIGN KEY ([NomenclatureId]) REFERENCES [Nomenclatures] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Items_Tares_TareId] FOREIGN KEY ([TareId]) REFERENCES [Tares] ([Id])
);

CREATE INDEX [IX_Nomenclatures_DefaultTareTypeId] ON [Nomenclatures] ([DefaultTareTypeId]);

CREATE INDEX [IX_Items_NomenclatureId] ON [Items] ([NomenclatureId]);

CREATE INDEX [IX_Items_OriginId] ON [Items] ([OriginId]);

CREATE INDEX [IX_Items_TareId] ON [Items] ([TareId]);

ALTER TABLE [Nomenclatures] ADD CONSTRAINT [FK_Nomenclatures_TareTypes_DefaultTareTypeId] FOREIGN KEY ([DefaultTareTypeId]) REFERENCES [TareTypes] ([Id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250423130836_ItemNomenclatureTares', N'9.0.2');

INSERT INTO dbo.Meta (Id, Metatype, Created, Owner) SELECT Id, 'Item', GETDATE(), 'User' FROM dbo.Items

ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Meta_Id] FOREIGN KEY ([Id]) REFERENCES [Meta] ([Id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250501181722_ItemWithMeta', N'9.0.2');

EXEC sp_rename N'[TareTypes].[Unit]', N'Units', 'COLUMN';

ALTER TABLE [Specifications] ADD [Active] bit NOT NULL DEFAULT CAST(0 AS bit);

ALTER TABLE [Specifications] ADD [Description] nvarchar(max) NULL;

ALTER TABLE [Specifications] ADD [DirectoryId] uniqueidentifier NULL;

ALTER TABLE [Specifications] ADD [Name] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Specifications] ADD [ProcessId] uniqueidentifier NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[SpecificationNomenclatures]') AND [c].[name] = N'Quantity');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [SpecificationNomenclatures] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [SpecificationNomenclatures] ALTER COLUMN [Quantity] float NOT NULL;

DECLARE @var6 sysname;
SELECT @var6 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Items]') AND [c].[name] = N'Quantity');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Items] DROP CONSTRAINT [' + @var6 + '];');
ALTER TABLE [Items] ALTER COLUMN [Quantity] float NOT NULL;

CREATE INDEX [IX_Specifications_DirectoryId] ON [Specifications] ([DirectoryId]);

CREATE INDEX [IX_Specifications_ProcessId] ON [Specifications] ([ProcessId]);

ALTER TABLE [Specifications] ADD CONSTRAINT [FK_Specifications_Directories_DirectoryId] FOREIGN KEY ([DirectoryId]) REFERENCES [Directories] ([Id]);

ALTER TABLE [Specifications] ADD CONSTRAINT [FK_Specifications_Meta_Id] FOREIGN KEY ([Id]) REFERENCES [Meta] ([Id]);

ALTER TABLE [Specifications] ADD CONSTRAINT [FK_Specifications_Processes_ProcessId] FOREIGN KEY ([ProcessId]) REFERENCES [Processes] ([Id]) ON DELETE CASCADE;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250502200153_SpecificationProcess', N'9.0.2');

ALTER TABLE [Items] ADD [OrderId] uniqueidentifier NULL;

ALTER TABLE [Items] ADD [ProcessId] uniqueidentifier NULL;

CREATE TABLE [Order] (
    [Id] uniqueidentifier NOT NULL,
    [Amount] float NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [DueDate] datetime2 NULL,
    [ProcessId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_Order] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Order_Meta_Id] FOREIGN KEY ([Id]) REFERENCES [Meta] ([Id]),
    CONSTRAINT [FK_Order_Processes_ProcessId] FOREIGN KEY ([ProcessId]) REFERENCES [Processes] ([Id])
);

CREATE TABLE [OrderProcess] (
    [Id] uniqueidentifier NOT NULL,
    [OrderId] uniqueidentifier NOT NULL,
    [ProcessId] uniqueidentifier NOT NULL,
    [StarTime] datetime2 NOT NULL,
    [EndTime] datetime2 NOT NULL,
    [Ordering] int NOT NULL,
    [OrderId1] uniqueidentifier NULL,
    CONSTRAINT [PK_OrderProcess] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_OrderProcess_Order_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Order] ([Id]),
    CONSTRAINT [FK_OrderProcess_Order_OrderId1] FOREIGN KEY ([OrderId1]) REFERENCES [Order] ([Id]),
    CONSTRAINT [FK_OrderProcess_Processes_ProcessId] FOREIGN KEY ([ProcessId]) REFERENCES [Processes] ([Id])
);

CREATE INDEX [IX_Items_OrderId] ON [Items] ([OrderId]);

CREATE INDEX [IX_Items_ProcessId] ON [Items] ([ProcessId]);

CREATE INDEX [IX_Order_ProcessId] ON [Order] ([ProcessId]);

CREATE INDEX [IX_OrderProcess_OrderId] ON [OrderProcess] ([OrderId]);

CREATE INDEX [IX_OrderProcess_OrderId1] ON [OrderProcess] ([OrderId1]);

CREATE INDEX [IX_OrderProcess_ProcessId] ON [OrderProcess] ([ProcessId]);

ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Order_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Order] ([Id]);

ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Processes_ProcessId] FOREIGN KEY ([ProcessId]) REFERENCES [Processes] ([Id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250509135243_Order', N'9.0.2');

ALTER TABLE [Processes] ADD [NomenclatureId] uniqueidentifier NULL;

CREATE INDEX [IX_Processes_NomenclatureId] ON [Processes] ([NomenclatureId]);

ALTER TABLE [Processes] ADD CONSTRAINT [FK_Processes_Nomenclatures_NomenclatureId] FOREIGN KEY ([NomenclatureId]) REFERENCES [Nomenclatures] ([Id]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250509200940_ProcessNomenclature', N'9.0.2');

DECLARE @var7 sysname;
SELECT @var7 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[OrderProcess]') AND [c].[name] = N'StarTime');
IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [OrderProcess] DROP CONSTRAINT [' + @var7 + '];');
ALTER TABLE [OrderProcess] DROP COLUMN [StarTime];

DECLARE @var8 sysname;
SELECT @var8 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[OrderProcess]') AND [c].[name] = N'EndTime');
IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [OrderProcess] DROP CONSTRAINT [' + @var8 + '];');
ALTER TABLE [OrderProcess] ALTER COLUMN [EndTime] datetime2 NULL;

ALTER TABLE [OrderProcess] ADD [StartTime] datetime2 NULL;

DECLARE @var9 sysname;
SELECT @var9 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Order]') AND [c].[name] = N'StartDate');
IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [Order] DROP CONSTRAINT [' + @var9 + '];');
ALTER TABLE [Order] ALTER COLUMN [StartDate] datetime2 NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250520193931_OrderProcessNullDates', N'9.0.2');

COMMIT;
GO

insert into Meta (Id, Metatype, Owner, Created, Groups) values ('00000000-0000-0000-0000-000000000000', 'directory','User', GETUTCDATE(), '[]')
insert into Directories (Id, Name, Description) values ('00000000-0000-0000-0000-000000000000', 'Root','Root folder')



