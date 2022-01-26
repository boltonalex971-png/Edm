using Optosense.Edm.Domain.Models;
using Optosense.Edm.Plugins;

namespace Microprojects.Edm.Ui.Main.Models
{
    public class WebModelsProfile : AutoMapper.Profile
    {
        public WebModelsProfile()
        {
            CreateMap<WorkplaceHostDevice, WorkplaceHostDeviceModel>()
                .ForMember(d => d.HostId, o => o.MapFrom(s => s.HostDevice.HostId))
                .ForMember(d => d.Host, o => o.MapFrom(s => s.HostDevice.Host.Name))
                .ForMember(d => d.Url, o => o.MapFrom(s => s.HostDevice.Host.Url))
                .ForMember(d => d.DeviceId, o => o.MapFrom(s => s.HostDevice.DeviceId))
                .ForMember(d => d.Device, o => o.MapFrom(s => s.HostDevice.Device.Name))
                .ForMember(d => d.DriverGuid, o => o.MapFrom(s => s.HostDevice.Device.DriverGuid))
                .ForMember(d => d.DriverName, o => o.Ignore())
                .ForMember(d => d.ProfilerName, o => o.Ignore())
                .ForMember(d => d.ProfilerGuid, o => o.Ignore());
            CreateMap<WorkplaceHostDeviceModel, WorkplaceHostDevice>()
                .ForMember(d => d.Workplace, o => o.Ignore())
                .ForMember(d => d.HostDevice, o => o.Ignore());

            CreateMap<HostDevice, IdNameModel>()
                .ForMember(d => d.Name, o => o.MapFrom(s => $"{s.Device.Name} ({s.Host.Name})"));

            CreateMap<WorkplaceProcess, WorkplaceProcessModel>();
            CreateMap<WorkplaceProcessModel, WorkplaceProcess>()
                .ForMember(d => d.Process, o => o.Ignore())
                .ForMember(d => d.Workplace, o => o.Ignore());

            CreateMap<Process, IdNameModel>();

            CreateMap<HostDevice, HostDeviceModel>()
                .ForMember(d => d.DriverGuid, o => o.MapFrom(s => s.Device.DriverGuid))
                .ForMember(d => d.DriverName, o => o.Ignore())
                .ForMember(d => d.ProfilerName, o => o.Ignore())
                .ForMember(d => d.ProfilerGuid, o => o.Ignore());
            CreateMap<HostDeviceModel, HostDevice>();
            //.ForMember(d => d.Host, o => o.Ignore());

            CreateMap<Device, IdNameModel>();
            CreateMap<Host, IdNameModel>();

            CreateMap<Operation, OperationViewModel>()
                .ForMember(d => d.ProcessId, o => o.MapFrom(s => s.Workbench.WorkplaceProcess.ProcessId))
                .ForMember(d => d.ProcessName, o => o.MapFrom(s => s.Workbench.WorkplaceProcess.Process.Name));

            CreateMap<OperationCriterion, OperationCriterionModel>();

            CreateMap<Optosense.Edm.Domain.Models.Profile, ProfileViewModel>()
                .ForMember(d => d.ProfilerGuid, o => o.MapFrom(s => s.ProfilerGuid))
                .ForMember(d => d.ProfilerName, o => o.Ignore());
            CreateMap<ProfileViewModel, Optosense.Edm.Domain.Models.Profile>();

            CreateMap<Workbench, WorkbenchViewModel>()
                .ForMember(d => d.ProcessName, o => o.MapFrom(s => s.WorkplaceProcess.Process.Name))
                .ForMember(d => d.OperationGuid, o => o.MapFrom(s => s.WorkplaceProcess.Process.OperationGuid))
                .ForMember(d => d.WorkplaceId, o => o.MapFrom(s => s.WorkplaceProcess.WorkplaceId))
                .ForMember(d => d.WorkplaceName, o => o.MapFrom(s => s.WorkplaceProcess.Workplace.Name));
            CreateMap<WorkbenchViewModel, Workbench>();

            CreateMap<WorkbenchWorkplaceHostDevice, WorkbenchDeviceConfigViewModel>()
                .ForMember(d => d.DeviceId, o => o.MapFrom(s => s.WorkplaceHostDevice.HostDevice.DeviceId))
                .ForMember(d => d.DeviceName, o => o.MapFrom(s => s.WorkplaceHostDevice.HostDevice.Device.Name))
                .ForMember(d => d.HostName, o => o.MapFrom(s => s.WorkplaceHostDevice.HostDevice.Host.Name))
                .ForMember(d => d.DriverGuid, o => o.MapFrom(s => s.WorkplaceHostDevice.HostDevice.Device.DriverGuid))
                .ForMember(d => d.DriverName, o => o.Ignore())
                .ForMember(d => d.ProfilerName, o => o.Ignore())
                .ForMember(d => d.ProfilerGuid, o => o.Ignore());
            CreateMap<WorkbenchDeviceConfigViewModel, WorkbenchWorkplaceHostDevice>();

            CreateMap<HierarchyItemViewModel, HierarchyItemViewModel>();
            CreateMap<Hierarchy, HierarchyViewModel>();
            CreateMap<Hierarchy, HierarchyItemViewModel>()
                .ForMember(d => d.IsNode, o => o.MapFrom(s => true))
                .ForMember(d => d.HierarchyType, o => o.MapFrom(s => s.Type))
                .ForMember(d => d.expanded, o => o.MapFrom(s => true))
                .ForMember(d => d.IsActive, o => o.MapFrom(s => true))
                .ForMember(d => d.Items, o => o.Ignore());
            CreateMap<Host, HierarchyItemViewModel>()
                .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
                .ForMember(d => d.expanded, o => o.MapFrom(s => false))
                .ForMember(d => d.ParentId, o => o.MapFrom(s => s.HierarchyId))
                .ForMember(d => d.IsActive, o => o.MapFrom(s => s.IsActive))
                .ForMember(d => d.Items, o => o.Ignore());
            CreateMap<Process, HierarchyItemViewModel>()
                .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
                .ForMember(d => d.expanded, o => o.MapFrom(s => false))
                .ForMember(d => d.ParentId, o => o.MapFrom(s => s.HierarchyId))
                .ForMember(d => d.IsActive, o => o.MapFrom(s => true))
                .ForMember(d => d.Items, o => o.Ignore());
            CreateMap<Workplace, HierarchyItemViewModel>()
                .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
                .ForMember(d => d.expanded, o => o.MapFrom(s => false))
                .ForMember(d => d.ParentId, o => o.MapFrom(s => s.HierarchyId))
                .ForMember(d => d.IsActive, o => o.MapFrom(s => true))
                .ForMember(d => d.Items, o => o.Ignore());
            CreateMap<Device, HierarchyItemViewModel>()
                .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
                .ForMember(d => d.expanded, o => o.MapFrom(s => false))
                .ForMember(d => d.ParentId, o => o.MapFrom(s => s.HierarchyId))
                .ForMember(d => d.IsActive, o => o.MapFrom(s => true))
                .ForMember(d => d.Items, o => o.Ignore());
            CreateMap<Host, HostModel>()
                .ForMember(d => d.Active, o => o.MapFrom(s => false))
                .ForMember(d => d.Version, o => o.MapFrom(s => "1.0.0"));

            CreateMap<IPlugin, PluginInfoViewModel>();
        }
    }
}
