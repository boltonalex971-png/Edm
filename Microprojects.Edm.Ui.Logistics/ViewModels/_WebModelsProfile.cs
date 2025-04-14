using Microprojects.Edm.Ui.Logistics.Models;
using Newtonsoft.Json;
using Optosense.Edm.Plugins;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class WebModelsProfile : AutoMapper.Profile
{
    public WebModelsProfile()
    {
        CreateMap<Process, ProcessViewModel>()
            .ForMember(p => p.IsFolder, o => o.MapFrom(s => false));
        CreateMap<ProcessViewModel, Process>();

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
    }
}