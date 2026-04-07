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
            .ForMember(d => d.Items, o => o.MapFrom(s => s.Children));
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
        CreateMap<Item, ItemViewModel>().ReverseMap()
            .ForMember(d => d.Nomenclature, o => o.Ignore())
            .ForMember(d => d.Supply, o => o.Ignore());
        CreateMap<Tare, TareViewModel>().ReverseMap()
            .ForMember(d => d.TareType, o => o.Ignore());
        CreateMap<SpecificationNomenclature, SpecificationRowViewModel>().ReverseMap();
        CreateMap<Order, OrderViewModel>().ReverseMap();

        CreateMap<Supply, SupplyViewModel>().ReverseMap();

        CreateMap<OrderSpecificationNomenclature, OrderSpecificationViewModel>();
        CreateMap<OrderProcess, OrderProcessViewModel>();
    }
}