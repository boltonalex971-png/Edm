using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public static class WebModelMappings
{
    public static DirectoryEntryViewModel ToEntryViewModel(this Directory s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            IsFolder = true,
            Expanded = true,
            Groups = s.Meta?.Groups,
            Items = s.Children?.Select(c => c.ToEntryViewModel()).ToArray(),
        };

    public static DirectoryViewModel ToViewModel(this Directory s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            IsFolder = true,
            Items = s.Children?.Select(c => c.ToEntryViewModel()).ToArray(),
            Groups = s.Meta?.Groups,
            IsPublic = s.Meta == null || s.Meta.Groups.Length == 0,
        };

    public static Directory ToEntity(this DirectoryViewModel s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            Meta = null!,
        };

    public static DirectoryEntryViewModel ToEntryViewModel(this DirectoryEntry s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            IsFolder = s is Directory,
            Expanded = true,
        };

    public static ProcessViewModel ToViewModel(this Process s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            Kind = s.Kind,
            NomenclatureId = s.NomenclatureId,
            NomenclatureName = s.Nomenclature?.Name,
        };

    public static Process ToEntity(this ProcessViewModel s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            Kind = s.Kind,
            NomenclatureId = s.NomenclatureId,
            Meta = null!,
        };

    public static SubProcessViewModel ToViewModel(this SubProcess s) =>
        new()
        {
            Id = s.Id,
            ProcessId = s.ProcessId,
            LinkedProcessId = s.LinkedProcessId,
            Order = s.Order,
            LinkedProcessName = s.LinkedProcess?.Name,
            LinkedProcessKind = s.LinkedProcess?.Kind.ToString(),
            LinkedProcessDescription = s.LinkedProcess?.Description,
        };

    public static SubProcess ToEntity(this SubProcessViewModel s) =>
        new()
        {
            Id = s.Id,
            ProcessId = s.ProcessId ?? Guid.Empty,
            LinkedProcessId = s.LinkedProcessId,
            Order = s.Order,
        };

    public static GradeViewModel ToViewModel(this Grade s) =>
        new()
        {
            Id = s.Id,
            ProcessId = s.ProcessId,
            Name = s.Name,
            Description = s.Description,
            QualifierName = s.QualifierName,
        };

    public static Grade ToEntity(this GradeViewModel s) =>
        new()
        {
            Id = s.Id,
            ProcessId = s.ProcessId ?? Guid.Empty,
            Name = s.Name,
            Description = s.Description,
            QualifierName = s.QualifierName,
        };

    public static NomenclatureViewModel ToViewModel(this Nomenclature s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            Category = s.Category,
            Countable = s.Countable,
            DefaultTareTypeId = s.DefaultTareTypeId,
            DefaultTareTypeName = s.DefaultTareType?.Name,
            Outdated = s.Meta?.Completed != null,
        };

    // DefaultTare is set via the AllowedTareTypes sub-route; ignore here so plain PUT cannot change it.
    public static Nomenclature ToEntity(this NomenclatureViewModel s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            Category = s.Category,
            Countable = s.Countable,
            Meta = null!,
        };

    public static NomenclatureTareTypeViewModel ToViewModel(this NomenclatureTareType s) =>
        new()
        {
            Id = s.Id,
            NomenclatureId = s.NomenclatureId,
            TareTypeId = s.TareTypeId,
            TareTypeName = s.TareType?.Name,
            TareTypeDescription = s.TareType?.Description,
            NomenclatureName = s.Nomenclature?.Name,
            NomenclatureDescription = s.Nomenclature?.Description,
            NomenclatureCategory = s.Nomenclature?.Category.ToString(),
            IsDefault = s.Nomenclature != null && s.Nomenclature.DefaultTareTypeId == s.TareTypeId,
        };

    public static TareTypeViewModel ToViewModel(this TareType s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            Units = s.Units,
            Countable = s.Countable,
            SizeX = s.SizeX,
            SizeY = s.SizeY,
            SizeZ = s.SizeZ,
            Dimensions = s.Dimensions,
            Capacity = s.Capacity,
            Outdated = s.Meta?.Completed != null,
        };

    public static TareType ToEntity(this TareTypeViewModel s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            Units = s.Units ?? string.Empty,
            Countable = s.Countable,
            SizeX = s.SizeX,
            SizeY = s.SizeY,
            SizeZ = s.SizeZ,
            Capacity = s.Capacity,
            Meta = null!,
        };

    public static ItemViewModel ToViewModel(this Item s) =>
        new()
        {
            Id = s.Id,
            SerialNo = s.SerialNo,
            Quantity = s.Quantity,
            NomenclatureId = s.NomenclatureId,
            NomenclatureName = s.Nomenclature?.Name,
            NomenclatureDescription = s.Nomenclature?.Description,
            NomenclatureCategory = s.Nomenclature?.Category.ToString(),
            NomenclatureCountable = s.Nomenclature != null && s.Nomenclature.Countable,
            NomenclatureUnits = s.Nomenclature?.DefaultTareType?.Units,
            TareId = s.TareId,
            TareBarcode = s.Tare?.Barcode,
            TareTareTypeId = s.Tare?.TareTypeId,
            TareTareTypeName = s.Tare?.TareType?.Name,
            TareTareTypeUnits = s.Tare?.TareType?.Units,
            TareTareTypeSizeX = s.Tare?.TareType?.SizeX,
            TareTareTypeSizeY = s.Tare?.TareType?.SizeY,
            TareTareTypeSizeZ = s.Tare?.TareType?.SizeZ,
            TareTareTypeDimensions = s.Tare?.TareType?.Dimensions ?? 0,
            TareTareTypeCapacity = s.Tare?.TareType?.Capacity ?? 0,
            Address = s.Address,
            MetaCreated = s.Meta?.Created ?? default,
            SupplyId = s.SupplyId,
            SupplyName = s.Supply == null
                ? null
                : !string.IsNullOrWhiteSpace(s.Supply.Shipment) ? s.Supply.Shipment : s.Supply.Barcode,
            OrderId = s.OrderId,
            OrderName = s.Order == null
                ? null
                : s.Order.Process != null && !string.IsNullOrWhiteSpace(s.Order.Process.Name)
                    ? s.Order.Process.Name
                    : s.Order.Description,
            OrderNumber = s.Order?.Number,
            ProcessId = s.ProcessId,
            ProcessName = s.Process?.Name,
            GradeId = s.GradeId,
            GradeName = s.Grade?.Name,
            IsOutput = s.ProcessId != null,
            Inactive = s.Meta != null && (s.Meta.Deleted != null || s.Meta.Completed != null),
            // IsStore is populated post-mapping by ItemFlags.Apply; leave it default.
        };

    public static Item ToEntity(this ItemViewModel s) =>
        new()
        {
            Id = s.Id,
            SerialNo = s.SerialNo,
            Quantity = s.Quantity,
            NomenclatureId = s.NomenclatureId,
            TareId = s.TareId,
            Address = s.Address,
            ProcessId = s.ProcessId,
            OrderId = s.OrderId,
            SupplyId = s.SupplyId,
            GradeId = s.GradeId,
            Meta = null!,
        };

    public static TareViewModel ToViewModel(this Tare s) =>
        new()
        {
            Id = s.Id,
            Barcode = s.Barcode,
            TareTypeId = s.TareTypeId,
            TareTypeName = s.TareType?.Name,
            TareTypeUnits = s.TareType?.Units,
            SizeX = s.TareType?.SizeX,
            SizeY = s.TareType?.SizeY,
            SizeZ = s.TareType?.SizeZ,
            Dimensions = s.TareType?.Dimensions ?? 0,
            Capacity = s.TareType?.Capacity ?? 0,
        };

    public static Tare ToEntity(this TareViewModel s) =>
        new()
        {
            Id = s.Id,
            Barcode = s.Barcode,
            TareTypeId = s.TareTypeId,
        };

    public static SpecificationRowViewModel ToViewModel(this SpecificationNomenclature s) =>
        new()
        {
            Id = s.Id,
            SpecificationId = s.SpecificationId,
            NomenclatureId = s.NomenclatureId,
            Quantity = s.Quantity,
            NomenclatureName = s.Nomenclature?.Name,
            NomenclatureDescription = s.Nomenclature?.Description,
            NomenclatureCategory = s.Nomenclature?.Category.ToString(),
        };

    public static SpecificationNomenclature ToEntity(this SpecificationRowViewModel s) =>
        new()
        {
            Id = s.Id,
            SpecificationId = s.SpecificationId,
            NomenclatureId = s.NomenclatureId,
            Quantity = s.Quantity,
        };

    public static OrderViewModel ToViewModel(this Order s) =>
        new()
        {
            Id = s.Id,
            Number = s.Number,
            ProcessId = s.ProcessId,
            ProcessName = s.Process?.Name,
            ProcessNomenclatureId = s.Process?.NomenclatureId,
            ProcessNomenclatureName = s.Process?.Nomenclature?.Name,
            ProcessNomenclatureCountable = s.Process != null && s.Process.Nomenclature != null && s.Process.Nomenclature.Countable,
            ProcessNomenclatureUnits = s.Process?.Nomenclature?.DefaultTareType?.Units,
            Description = s.Description,
            Amount = s.Amount,
            StartDate = s.StartDate,
            DueDate = s.DueDate,
            Completed = s.Meta?.Completed,
            Deleted = s.Meta?.Deleted,
            Executor = s.Meta?.Executor,
            // Status and Mine are derived server-side in OrderService; leave them default.
        };

    public static Order ToEntity(this OrderViewModel s) =>
        new()
        {
            Id = s.Id,
            Number = s.Number ?? string.Empty,
            ProcessId = s.ProcessId ?? Guid.Empty,
            Description = s.Description,
            Amount = s.Amount ?? 0,
            StartDate = s.StartDate,
            DueDate = s.DueDate,
        };

    public static SupplyViewModel ToViewModel(this Supply s) =>
        new()
        {
            Id = s.Id,
            Barcode = s.Barcode,
            Shipment = s.Shipment,
            ShipmentExternalId = s.ShipmentExternalId,
            MetaCreated = s.Meta?.Created ?? default,
        };

    public static Supply ToEntity(this SupplyViewModel s) =>
        new()
        {
            Id = s.Id,
            Barcode = s.Barcode,
            Shipment = s.Shipment,
            ShipmentExternalId = s.ShipmentExternalId,
        };

    public static OrderSpecificationNomenclatureViewModel ToViewModel(this OrderSpecificationNomenclature s) =>
        new()
        {
            Id = s.Id,
            NomenclatureId = s.NomenclatureId,
            NomenclatureName = s.Nomenclature?.Name,
            NomenclatureDescription = s.Nomenclature?.Description,
            NomenclatureCategory = s.Nomenclature?.Category.ToString(),
            NomenclatureCountable = s.Nomenclature?.Countable ?? false,
            ProcessId = s.ProcessId,
            ProcessName = s.Process?.Name,
            Amount = s.Amount,
            Total = s.Total,
        };

    public static OrderProcessViewModel ToViewModel(this OrderProcess s) =>
        new()
        {
            Id = s.Id,
            OrderId = s.OrderId,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            ProcessId = s.ProcessId,
            ProcessName = s.Process?.Name,
            ProcessKind = s.Process?.Kind,
            ProcessNomenclatureId = s.Process?.NomenclatureId,
            ProcessNomenclatureName = s.Process?.Nomenclature?.Name,
        };

    public static SpecificationViewModel ToViewModel(this Specification s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
        };

    public static Specification ToEntity(this SpecificationViewModel s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            Meta = null!,
        };
}
