using System;
using System.Linq;
using Microprojects.Edm.Models;
using Microprojects.Edm.Plugins;
using Newtonsoft.Json;

namespace Microprojects.Edm.Ui.Technologies.Models
{
    public static class WebModelMappings
    {
        public static WorkplaceHostDeviceModel ToModel(this WorkplaceHostDevice s, IPluginContainer? plugins = null)
        {
            var driverGuid = s.HostDevice?.Device?.DriverGuid ?? Guid.Empty;
            var driver = plugins?.GetDriver(driverGuid);
            var profiler = plugins?.GetProfileByDriver(driverGuid);
            return new WorkplaceHostDeviceModel
            {
                Id = s.Id,
                WorkplaceId = s.WorkplaceId,
                HostDeviceId = s.HostDeviceId,
                HostId = s.HostDevice?.HostId ?? Guid.Empty,
                Host = s.HostDevice?.Host?.Name,
                Url = s.HostDevice?.Host?.Url,
                DeviceId = s.HostDevice?.DeviceId ?? Guid.Empty,
                Device = s.HostDevice?.Device?.Name,
                DriverGuid = driverGuid,
                DriverName = driver?.Name,
                DriverHomepage = driver?.Homepage,
                ProfilerName = profiler?.Name,
                ProfilerGuid = driver?.ProfileGuid ?? Guid.Empty,
            };
        }

        public static WorkplaceHostDevice ToEntity(this WorkplaceHostDeviceModel s) =>
            new WorkplaceHostDevice
            {
                Id = s.Id,
                WorkplaceId = s.WorkplaceId,
                HostDeviceId = s.HostDeviceId,
            };

        public static IdNameModel ToIdNameModel(this HostDevice s) =>
            new IdNameModel
            {
                Id = s.Id,
                Name = $"{s.Device?.Name} ({s.Host?.Name})",
            };

        public static IdNameModel ToIdNameModel(this Process s) =>
            new IdNameModel { Id = s.Id, Name = s.Name };

        public static IdNameModel ToIdNameModel(this Device s) =>
            new IdNameModel { Id = s.Id, Name = s.Name };

        public static IdNameModel ToIdNameModel(this Host s) =>
            new IdNameModel { Id = s.Id, Name = s.Name };

        public static WorkplaceProcessModel ToModel(this WorkplaceProcess s) =>
            new WorkplaceProcessModel
            {
                Id = s.Id,
                WorkplaceId = s.WorkplaceId,
                ProcessId = s.ProcessId,
                ProcessName = s.Process?.Name,
                ProcessDescription = s.Process?.Description,
                WorkplaceName = s.Workplace?.Name,
                WorkplaceDescription = s.Workplace?.Description,
                Process = s.Process?.ToViewModel(),
            };

        public static WorkplaceProcess ToEntity(this WorkplaceProcessModel s) =>
            new WorkplaceProcess
            {
                Id = s.Id,
                WorkplaceId = s.WorkplaceId,
                ProcessId = s.ProcessId,
            };

        public static ProcessViewModel ToViewModel(this Process s) =>
            new ProcessViewModel
            {
                Id = s.Id,
                CommonUid = s.CommonUid,
                Name = s.Name,
                Description = s.Description,
                DirectoryId = s.DirectoryId,
                OperationGuid = s.OperationGuid,
                Message = s.Profiles == null
                    ? null
                    : JsonConvert.SerializeObject(s.Profiles
                        .SelectMany(p => JsonConvert.DeserializeObject<string[]>(p.Input ?? "[]"))
                        .Distinct()
                        .Except(s.Profiles
                            .SelectMany(p => JsonConvert.DeserializeObject<string[]>(p.Output ?? "[]"))
                            .Distinct())),
                Qualifiers = s.Qualifiers?.Select(q => q.ToViewModel()).ToList(),
                Profiles = s.Profiles?.Select(p => p.ToViewModel()).ToList(),
            };

        public static QualifierViewModel ToViewModel(this Qualifier s) =>
            new QualifierViewModel
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
            };

        public static Qualifier ToEntity(this QualifierViewModel s) =>
            new Qualifier
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                Meta = null!,
            };

        public static HostDeviceModel ToModel(this HostDevice s, IPluginContainer? plugins = null)
        {
            var driverGuid = s.Device?.DriverGuid ?? Guid.Empty;
            var driver = plugins?.GetDriver(driverGuid);
            var profiler = plugins?.GetProfileByDriver(driverGuid);
            return new HostDeviceModel
            {
                Id = s.Id,
                HostId = s.HostId,
                DeviceId = s.DeviceId,
                HostName = s.Host?.Name,
                HostUrl = s.Host?.Url,
                HostPort = s.Host?.Port.ToString(),
                DeviceName = s.Device?.Name,
                DriverGuid = driverGuid,
                DriverName = driver?.Name,
                DriverHomepage = driver?.Homepage,
                ProfilerName = profiler?.Name,
                ProfilerGuid = driver?.ProfileGuid ?? Guid.Empty,
            };
        }

        public static HostDevice ToEntity(this HostDeviceModel s) =>
            new HostDevice
            {
                Id = s.Id,
                HostId = s.HostId,
                DeviceId = s.DeviceId,
            };

        public static OperationViewModel ToViewModel(this Operation s) =>
            new OperationViewModel
            {
                Id = s.Id,
                WorkbenchId = s.WorkbenchId ?? Guid.Empty,
                WorkbenchName = s.Workbench?.Name,
                WorkplaceName = s.WorkplaceProcess?.Workplace?.Name,
                ProcessId = s.WorkplaceProcess?.ProcessId ?? Guid.Empty,
                ProcessName = s.WorkplaceProcess?.Process?.Name,
                ProcessDescription = s.WorkplaceProcess?.Process?.Description,
                Created = s.Created,
                Started = s.Started,
                Completed = s.Completed,
                Cancelled = s.Cancelled,
                Parameters = s.Parameters,
                State = s.Cancelled != null
                    ? OperationState.Cancelled
                    : s.Completed != null
                        ? OperationState.Completed
                        : s.Started == null
                            ? OperationState.Idle
                            : OperationState.InProgress,
            };

        public static OperationCriterionModel ToModel(this OperationCriterion s) =>
            new OperationCriterionModel
            {
                Id = s.Id,
                Valid = s.Valid,
                Selector = s.Selector,
                Result = s.Result,
                Message = s.Message,
                AuditCriterionParam = s.AuditCriterion?.Param,
                AuditCriterionFunction = s.AuditCriterion?.Function,
                AuditCriterionArgs = s.AuditCriterion?.Args,
                AuditCriterionArg1 = s.AuditCriterion?.Arg1,
                AuditCriterionArg2 = s.AuditCriterion?.Arg2,
                ZoneAuditCriterionNo = s.AuditCriterion?.Zone?.No,
                ZoneAuditCriterionOffset = s.AuditCriterion?.Zone?.Offset ?? 0,
                ZoneAuditCriterionDuration = s.AuditCriterion?.Zone?.Duration ?? 0,
            };

        public static ProfileViewModel ToViewModel(this Profile s) =>
            new ProfileViewModel
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                Input = s.Input,
                Output = s.Output,
                ProfilerGuid = s.ProfilerGuid,
            };

        public static Profile ToEntity(this ProfileViewModel s) =>
            new Profile
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                Input = s.Input,
                Output = s.Output,
                ProfilerGuid = s.ProfilerGuid,
                Meta = null!,
            };

        public static WorkbenchViewModel ToViewModel(this Workbench s) =>
            new WorkbenchViewModel
            {
                Id = s.Id,
                CommonUid = s.CommonUid,
                WorkplaceId = s.WorkplaceProcess?.WorkplaceId ?? Guid.Empty,
                WorkplaceProcessId = s.WorkplaceProcessId,
                Name = s.Name,
                WorkplaceName = s.WorkplaceProcess?.Workplace?.Name,
                ProcessId = s.WorkplaceProcess?.ProcessId ?? Guid.Empty,
                ProcessName = s.WorkplaceProcess?.Process?.Name,
                OperationGuid = s.WorkplaceProcess?.Process?.OperationGuid ?? Guid.Empty,
                Description = s.Description,
                IsActive = s.Meta?.Deleted == null,
            };

        public static Workbench ToEntity(this WorkbenchViewModel s) =>
            new Workbench
            {
                Id = s.Id,
                CommonUid = s.CommonUid,
                WorkplaceProcessId = s.WorkplaceProcessId,
                Name = s.Name,
                Description = s.Description,
                Meta = null!,
            };

        public static WorkbenchDeviceConfigViewModel ToViewModel(this WorkbenchWorkplaceHostDevice s) =>
            new WorkbenchDeviceConfigViewModel
            {
                Id = s.Id,
                WorkbenchId = s.WorkbenchId,
                WorkplaceHostDeviceId = s.WorkplaceHostDeviceId,
                HostDeviceId = s.WorkplaceHostDevice?.HostDeviceId ?? Guid.Empty,
                HostId = s.WorkplaceHostDevice?.HostDevice?.HostId ?? Guid.Empty,
                ProfileId = s.ProfileId,
                DeviceId = s.WorkplaceHostDevice?.HostDevice?.DeviceId ?? Guid.Empty,
                DeviceName = s.WorkplaceHostDevice?.HostDevice?.Device?.Name,
                ProfileName = s.Profile?.Name,
                HostName = s.WorkplaceHostDevice?.HostDevice?.Host?.Name,
                Configuration = s.Configuration,
                DriverGuid = s.WorkplaceHostDevice?.HostDevice?.Device?.DriverGuid ?? Guid.Empty,
                ProfilerGuid = s.Profile?.ProfilerGuid ?? Guid.Empty,
            };

        public static WorkbenchWorkplaceHostDevice ToEntity(this WorkbenchDeviceConfigViewModel s) =>
            new WorkbenchWorkplaceHostDevice
            {
                Id = s.Id,
                WorkbenchId = s.WorkbenchId,
                WorkplaceHostDeviceId = s.WorkplaceHostDeviceId,
                ProfileId = s.ProfileId,
                Configuration = s.Configuration,
            };

        public static HostModel ToModel(this Host s, Peer peer) =>
            new HostModel
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                DirectoryId = s.DirectoryId,
                Url = s.Url,
                Port = s.Port,
                Active = peer.Host != null,
                Version = peer.Version,
                Environment = peer.Environment,
                Mode = peer.Mode,
                UiPort = peer.UiPort,
                Meta = s.Meta!,
            };

        public static PluginInfoViewModel ToViewModel(this IPlugin s) =>
            new PluginInfoViewModel
            {
                Name = s.Name,
                Description = s.Description,
                Guid = s.Guid.ToString(),
                Homepage = s.Homepage,
            };
    }
}
