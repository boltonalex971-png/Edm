using Microprojects.Edm.Ui.Logistics.Models;
using Newtonsoft.Json;
using Optosense.Edm.Plugins;
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
        
        CreateMap<Nomenclature, NomenclatureViewModel>();
        CreateMap<NomenclatureViewModel, Nomenclature>();
        CreateMap<TareType, TareTypeViewModel>();
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