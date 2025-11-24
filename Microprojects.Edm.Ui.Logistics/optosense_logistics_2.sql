BEGIN TRANSACTION;
DECLARE @var sysname;
SELECT @var = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TareTypes]') AND [c].[name] = N'Capacity');
IF @var IS NOT NULL EXEC(N'ALTER TABLE [TareTypes] DROP CONSTRAINT [' + @var + '];');
ALTER TABLE [TareTypes] ALTER COLUMN [Capacity] float NOT NULL;

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Tares]') AND [c].[name] = N'Barcode');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Tares] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [Tares] ALTER COLUMN [Barcode] nvarchar(max) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250606071649_DoubleQuantity', N'9.0.2');

COMMIT;
GO


