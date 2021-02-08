using AutoMapper;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Webui.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Optosense.Edm.WebUi.Models
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
                .ForMember(d => d.Model, o => o.MapFrom(s => s.HostDevice.Device.Model.ToString()))
                .ForMember(d => d.EnvType, o => o.MapFrom(s => s.HostDevice.Device.EnvType.ToString()));
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

            CreateMap<HostDevice, HostDeviceModel>();
            CreateMap<HostDeviceModel, HostDevice>();
                //.ForMember(d => d.Host, o => o.Ignore());

            CreateMap<Device, IdNameModel>();
            CreateMap<Host, IdNameModel>();

            CreateMap<Operation, OperationModel>();

            CreateMap<Domain.Models.Profile, ProfileViewModel>();
            CreateMap<ProfileViewModel, Domain.Models.Profile>();
        }
    }
}
