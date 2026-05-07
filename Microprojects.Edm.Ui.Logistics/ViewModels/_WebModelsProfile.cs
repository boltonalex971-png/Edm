using Microprojects.Edm.Ui.Logistics.Models;
using Newtonsoft.Json;
using Microprojects.Edm.Plugins;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class WebModelsProfile : AutoMapper.Profile
{
    public WebModelsProfile()
    {
        CreateMap<Directory, DirectoryEntryViewModel>()
            .ForMember(d => d.IsFolder, o => o.MapFrom(s => true))
            .ForMember(d => d.Expanded, o => o.MapFrom(s => true))
            .ForMember(d => d.Items, o => o.MapFrom(s => s.Children));
        CreateMap<Directory, DirectoryViewModel>()
            .ForMember(d => d.IsFolder, o => o.MapFrom(s => true))
            .ForMember(d => d.Items, o => o.MapFrom(s => s.Children))
            .ForMember(d => d.Groups, o => o.MapFrom(s => s.Meta != null ? s.Meta.Groups : null))
            .ForMember(d => d.IsPublic, o => o.MapFrom(s => s.Meta == null || s.Meta.Groups.Length == 0));
        CreateMap<DirectoryViewModel, Directory>();

        CreateMap<DirectoryEntryViewModel, DirectoryEntryViewModel>();
        CreateMap<DirectoryEntry, DirectoryEntryViewModel>()
            .ForMember(d => d.IsFolder, o => o.MapFrom(s => s is Directory))
            .ForMember(d => d.Expanded, o => o.MapFrom(s => true))
            .ForMember(d => d.DirectoryId, o => o.MapFrom(s => s.DirectoryId));

        CreateMap<Process, ProcessViewModel>();
        CreateMap<ProcessViewModel, Process>();

        CreateMap<SubProcess, SubProcessViewModel>();
        CreateMap<SubProcessViewModel, SubProcess>();

        CreateMap<Grade, GradeViewModel>();
        CreateMap<GradeViewModel, Grade>();
        
        CreateMap<Nomenclature, NomenclatureViewModel>()
            .ForMember(d => d.DefaultTareTypeName, o => o.MapFrom(s =>
                s.DefaultTareType != null ? s.DefaultTareType.Name : null))
            .ForMember(d => d.Outdated, o => o.MapFrom(s =>
                s.Meta != null && s.Meta.Completed != null));
        // Default tare is set via the AllowedTareTypes sub-route; ignore here so plain PUT cannot change it.
        CreateMap<NomenclatureViewModel, Nomenclature>()
            .ForMember(d => d.DefaultTareTypeId, o => o.Ignore())
            .ForMember(d => d.DefaultTareType, o => o.Ignore())
            .ForMember(d => d.AllowedTareTypes, o => o.Ignore());

        CreateMap<NomenclatureTareType, NomenclatureTareTypeViewModel>()
            .ForMember(d => d.TareTypeName, o => o.MapFrom(s => s.TareType.Name))
            .ForMember(d => d.TareTypeDescription, o => o.MapFrom(s => s.TareType.Description))
            .ForMember(d => d.NomenclatureName, o => o.MapFrom(s => s.Nomenclature.Name))
            .ForMember(d => d.NomenclatureDescription, o => o.MapFrom(s => s.Nomenclature.Description))
            .ForMember(d => d.NomenclatureCategory, o => o.MapFrom(s => s.Nomenclature.Category.ToString()))
            .ForMember(d => d.IsDefault, o => o.MapFrom(s => s.Nomenclature.DefaultTareTypeId == s.TareTypeId));
        CreateMap<TareType, TareTypeViewModel>()
            .ForMember(d => d.Outdated, o => o.MapFrom(s =>
                s.Meta != null && s.Meta.Completed != null));
        CreateMap<TareTypeViewModel, TareType>();
        CreateMap<Item, ItemViewModel>()
            .ForMember(d => d.SupplyName, o => o.MapFrom(s =>
                s.Supply == null
                    ? null
                    : (!string.IsNullOrWhiteSpace(s.Supply.Shipment)
                        ? s.Supply.Shipment
                        : s.Supply.Barcode)))
            .ForMember(d => d.OrderName, o => o.MapFrom(s =>
                s.Order == null
                    ? null
                    : (s.Order.Process != null && !string.IsNullOrWhiteSpace(s.Order.Process.Name)
                        ? s.Order.Process.Name
                        : s.Order.Description)))
            .ForMember(d => d.OrderNumber, o => o.MapFrom(s =>
                s.Order == null ? null : s.Order.Number))
            .ForMember(d => d.ProcessName, o => o.MapFrom(s =>
                s.Process == null ? null : s.Process.Name))
            .ForMember(d => d.GradeName, o => o.MapFrom(s =>
                s.Grade == null ? null : s.Grade.Name))
            .ForMember(d => d.NomenclatureCountable, o => o.MapFrom(s =>
                s.Nomenclature != null && s.Nomenclature.Countable))
            .ForMember(d => d.NomenclatureUnits, o => o.MapFrom(s =>
                s.Nomenclature != null && s.Nomenclature.DefaultTareType != null
                    ? s.Nomenclature.DefaultTareType.Units
                    : null))
            .ForMember(d => d.IsOutput, o => o.MapFrom(s => s.ProcessId != null))
            .ForMember(d => d.Inactive, o => o.MapFrom(s =>
                s.Meta != null && (s.Meta.Deleted != null || s.Meta.Completed != null)))
            // IsStore is populated post-mapping by ItemFlags.Apply; the entity
            // no longer carries it.
            .ForMember(d => d.IsStore, o => o.Ignore())
            .ReverseMap()
            .ForMember(d => d.Nomenclature, o => o.Ignore())
            .ForMember(d => d.Supply, o => o.Ignore())
            .ForMember(d => d.Order, o => o.Ignore())
            .ForMember(d => d.Process, o => o.Ignore())
            .ForMember(d => d.Grade, o => o.Ignore());
        CreateMap<Tare, TareViewModel>().ReverseMap()
            .ForMember(d => d.TareType, o => o.Ignore());
        CreateMap<SpecificationNomenclature, SpecificationRowViewModel>().ReverseMap();
        CreateMap<Order, OrderViewModel>()
            .ForMember(d => d.Completed, o => o.MapFrom(s => s.Meta != null ? s.Meta.Completed : null))
            .ForMember(d => d.Deleted, o => o.MapFrom(s => s.Meta != null ? s.Meta.Deleted : null))
            .ForMember(d => d.Executor, o => o.MapFrom(s => s.Meta != null ? s.Meta.Executor : null))
            .ForMember(d => d.ProcessNomenclatureCountable, o => o.MapFrom(s =>
                s.Process != null && s.Process.Nomenclature != null && s.Process.Nomenclature.Countable))
            .ForMember(d => d.ProcessNomenclatureUnits, o => o.MapFrom(s =>
                s.Process != null && s.Process.Nomenclature != null && s.Process.Nomenclature.DefaultTareType != null
                    ? s.Process.Nomenclature.DefaultTareType.Units
                    : null))
            // Status and Mine are derived server-side in OrderService; leave them out of the map.
            .ForMember(d => d.Status, o => o.Ignore())
            .ForMember(d => d.Mine, o => o.Ignore())
            .ReverseMap()
            .ForMember(d => d.Meta, o => o.Ignore());

        CreateMap<Supply, SupplyViewModel>().ReverseMap();

        CreateMap<OrderSpecificationNomenclature, OrderSpecificationViewModel>();
        CreateMap<OrderProcess, OrderProcessViewModel>();
    }
}