using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Models;
using Optosense.Edm.Plugins;
using System.Collections.Generic;
using System.Linq;
using Optosense.Edm.Core.Models;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Models
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
                .ForMember(d => d.DriverName,
                    o => o.MapFrom((s, d, m, c) =>
                        (c.State as IPluginContainer)?.GetDriver(s.HostDevice.Device.DriverGuid)?.Name))
                .ForMember(d => d.DriverHomepage,
                    o => o.MapFrom((s, d, m, c) =>
                        (c.State as IPluginContainer)?.GetDriver(s.HostDevice.Device.DriverGuid)?.Homepage))
                .ForMember(d => d.ProfilerName,
                    o => o.MapFrom((s, d, m, c) =>
                        (c.State as IPluginContainer)?.GetProfileByDriver(s.HostDevice.Device.DriverGuid)?.Name))
                .ForMember(d => d.ProfilerGuid,
                    o => o.MapFrom((s, d, m, c) =>
                        (c.State as IPluginContainer)?.GetDriver(s.HostDevice.Device.DriverGuid)?.ProfileGuid));
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
            CreateMap<Process, ProcessViewModel>()
                .ForMember(d => d.Message,
                    o => o.MapFrom(s => JsonConvert.SerializeObject(s.Profiles
                        .SelectMany(p => JsonConvert.DeserializeObject<string[]>(p.Input ?? "[]"))
                        .Distinct()
                        .Except(s.Profiles
                            .SelectMany(p => JsonConvert.DeserializeObject<string[]>(p.Output ?? "[]"))
                            .Distinct())
                    )));

            CreateMap<Qualifier, QualifierViewModel>();
            CreateMap<QualifierViewModel, Qualifier>();

            CreateMap<HostDevice, HostDeviceModel>()
                .ForMember(d => d.DriverGuid, o => o.MapFrom(s => s.Device.DriverGuid))
                .ForMember(d => d.DriverName,
                    o => o.MapFrom((s, d, m, c) => (c.State as IPluginContainer)?.GetDriver(s.Device.DriverGuid)?.Name))
                .ForMember(d => d.DriverHomepage,
                    o => o.MapFrom((s, d, m, c) =>
                        (c.State as IPluginContainer)?.GetDriver(s.Device.DriverGuid)?.Homepage))
                .ForMember(d => d.ProfilerName,
                    o => o.MapFrom((s, d, m, c) =>
                        (c.State as IPluginContainer)?.GetProfileByDriver(s.Device.DriverGuid)))
                .ForMember(d => d.ProfilerGuid,
                    o => o.MapFrom((s, d, m, c) =>
                        (c.State as IPluginContainer)?.GetDriver(s.Device.DriverGuid)?.ProfileGuid));
            CreateMap<HostDeviceModel, HostDevice>();
            //.ForMember(d => d.Host, o => o.Ignore());

            CreateMap<Device, IdNameModel>();
            CreateMap<Host, IdNameModel>();

            CreateMap<Operation, OperationViewModel>()
                .ForMember(d => d.State, o => o.MapFrom(s =>
                    s.Cancelled != null ? OperationState.Cancelled :
                    s.Completed != null ? OperationState.Completed :
                    s.Started == null ? OperationState.Idle : OperationState.InProgress))
                .ForMember(d => d.ProcessId, o => o.MapFrom(s => s.WorkplaceProcess.ProcessId))
                .ForMember(d => d.ProcessName, o => o.MapFrom(s => s.WorkplaceProcess.Process.Name))
                .ForMember(d => d.WorkplaceName, o => o.MapFrom(s => s.WorkplaceProcess.Workplace.Name));

            CreateMap<OperationCriterion, OperationCriterionModel>();

            CreateMap<Microprojects.Edm.Ui.Technologies.Models.Profile, ProfileViewModel>()
                .ForMember(d => d.ProfilerGuid, o => o.MapFrom(s => s.ProfilerGuid))
                .ForMember(d => d.ProfilerName, o => o.Ignore());
            CreateMap<ProfileViewModel, Microprojects.Edm.Ui.Technologies.Models.Profile>();

            CreateMap<Workbench, WorkbenchViewModel>()
                .ForMember(d => d.ProcessId, o => o.MapFrom(s => s.WorkplaceProcess.ProcessId))
                .ForMember(d => d.ProcessName, o => o.MapFrom(s => s.WorkplaceProcess.Process.Name))
                .ForMember(d => d.OperationGuid, o => o.MapFrom(s => s.WorkplaceProcess.Process.OperationGuid))
                .ForMember(d => d.WorkplaceId, o => o.MapFrom(s => s.WorkplaceProcess.WorkplaceId))
                .ForMember(d => d.WorkplaceName, o => o.MapFrom(s => s.WorkplaceProcess.Workplace.Name));
            CreateMap<WorkbenchViewModel, Workbench>();

            CreateMap<WorkbenchWorkplaceHostDevice, WorkbenchDeviceConfigViewModel>()
                .ForMember(d => d.DeviceId, o => o.MapFrom(s => s.WorkplaceHostDevice.HostDevice.DeviceId))
                .ForMember(d => d.HostDeviceId, o => o.MapFrom(s => s.WorkplaceHostDevice.HostDeviceId))
                .ForMember(d => d.DeviceName, o => o.MapFrom(s => s.WorkplaceHostDevice.HostDevice.Device.Name))
                .ForMember(d => d.ProfileName, o => o.MapFrom(s => s.Profile.Name))
                .ForMember(d => d.HostName, o => o.MapFrom(s => s.WorkplaceHostDevice.HostDevice.Host.Name))
                .ForMember(d => d.DriverGuid, o => o.MapFrom(s => s.WorkplaceHostDevice.HostDevice.Device.DriverGuid))
                .ForMember(d => d.ProfilerGuid, o => o.MapFrom(s => s.Profile.ProfilerGuid))
                .ForMember(d => d.DriverName, o => o.Ignore())
                .ForMember(d => d.ProfilerName, o => o.Ignore());
            CreateMap<WorkbenchDeviceConfigViewModel, WorkbenchWorkplaceHostDevice>();

            CreateMap<HierarchyItemViewModel, HierarchyItemViewModel>();
            CreateMap<Hierarchy, HierarchyViewModel>();
            CreateMap<Hierarchy, HierarchyItemViewModel>()
                .ForMember(d => d.IsNode, o => o.MapFrom(s => true))
                .ForMember(d => d.HierarchyType, o => o.MapFrom(s => s.Type))
                .ForMember(d => d.expanded, o => o.MapFrom(s => true))
                .ForMember(d => d.IsActive, o => o.MapFrom(s => true));
            //.ForMember(d => d.Items, o => o.Ignore());
            CreateMap<HierarchyObject, HierarchyItemViewModel>()
                .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
                .ForMember(d => d.expanded, o => o.MapFrom(s => false))
                .ForMember(d => d.ParentId, o => o.MapFrom(s => s.HierarchyId))
                //.ForMember(d => d.HierarchyType, o => o.MapFrom((s, d, v, c) => c.Items["Type"]))
                //.ForMember(d => d.IsActive, o => o.MapFrom(s => s.IsActive))
                .ForMember(d => d.Items, o => o.Ignore());
            CreateMap<WorkplaceProcess, HierarchyItemViewModel>()
                .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
                .ForMember(d => d.expanded, o => o.MapFrom(s => false))
                .ForMember(d => d.Name, o => o.MapFrom(s => s.Process.Name))
                .ForMember(d => d.Id, o => o.MapFrom(s => s.Id)) //ProcessId))
                .ForMember(d => d.ParentId, o => o.MapFrom(s => s.WorkplaceId))
                .ForMember(d => d.IsActive, o => o.MapFrom(s => true))
                .ForMember(d => d.Items, o => o.Ignore());
            //CreateMap<Host, HierarchyItemViewModel>()
            //    .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
            //    .ForMember(d => d.expanded, o => o.MapFrom(s => false))
            //    .ForMember(d => d.ParentId, o => o.MapFrom(s => s.HierarchyId))
            //    .ForMember(d => d.IsActive, o => o.MapFrom(s => s.IsActive))
            //    .ForMember(d => d.Items, o => o.Ignore());
            //CreateMap<Process, HierarchyItemViewModel>()
            //    .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
            //    .ForMember(d => d.expanded, o => o.MapFrom(s => false))
            //    .ForMember(d => d.ParentId, o => o.MapFrom(s => s.HierarchyId))
            //    .ForMember(d => d.IsActive, o => o.MapFrom(s => true))
            //    .ForMember(d => d.Items, o => o.Ignore());
            //CreateMap<Workplace, HierarchyItemViewModel>()
            //    .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
            //    .ForMember(d => d.expanded, o => o.MapFrom(s => false))
            //    .ForMember(d => d.ParentId, o => o.MapFrom(s => s.HierarchyId))
            //    .ForMember(d => d.IsActive, o => o.MapFrom(s => true))
            //    .ForMember(d => d.Items, o => o.Ignore());
            //CreateMap<Device, HierarchyItemViewModel>()
            //    .ForMember(d => d.IsNode, o => o.MapFrom(s => false))
            //    .ForMember(d => d.expanded, o => o.MapFrom(s => false))
            //    .ForMember(d => d.ParentId, o => o.MapFrom(s => s.HierarchyId))
            //    .ForMember(d => d.IsActive, o => o.MapFrom(s => true))
            //    .ForMember(d => d.Items, o => o.Ignore());
            CreateMap<Host, HostModel>()
                .ForMember(d => d.Active, o => o.MapFrom((s, d, v, c) => ((Peer)c.Items["Peer"]).Host != null))
                .ForMember(d => d.Version, o => o.MapFrom((s, d, v, c) => ((Peer)c.Items["Peer"]).Version))
                .ForMember(d => d.Environment, o => o.MapFrom((s, d, v, c) => ((Peer)c.Items["Peer"]).Environment))
                .ForMember(d => d.Mode, o => o.MapFrom((s, d, v, c) => ((Peer)c.Items["Peer"]).Mode))
                .ForMember(d => d.UiPort, o => o.MapFrom((s, d, v, c) => ((Peer)c.Items["Peer"]).UiPort));

            CreateMap<IPlugin, PluginInfoViewModel>();
        }
    }
}