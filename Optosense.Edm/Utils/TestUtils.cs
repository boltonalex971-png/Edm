using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using Optosense.Edm.Drivers;
using Newtonsoft.Json;
using System.Text.RegularExpressions;

namespace Optosense.Edm.Utils
{
    public static class TestUtils
    {
        public const long InstructionDuration = 1000;

        //public static List<Record> GetTestPlan(string connectionString, int stageId, string host = null, DateTime? startAt = null)
        //{
        //    using (var _db = new EdmContext(connectionString))
        //    {
        //        var stage = _db.Stages
        //            .Include(s => s.CommandProfile)
        //            .Include(s => s.CommandProfile.ProfileCommands)
        //            .Include(s => s.CommandProfile.ProfileCommands.Select(pc => pc.Command))
        //            .Include(s => s.CommandProfile.ProfileCommands.Select(pc => pc.Command.CommandInstructions))
        //            .Include(s => s.CommandProfile.ProfileCommands.Select(pc => pc.Command.CommandInstructions.Select(ci => ci.Instruction)))
        //            .Include(s => s.Test)
        //            .Include(s => s.Test.TestSensors)
        //            .First(s => s.Id == stageId && s.IsValid);

        //        var profile = stage.CommandProfile;

        //        if (profile == null)
        //        {
        //            throw new Exception($"No such stage with Id {stageId}");
        //        }

        //        var ports = stage.Test.TestSensors

        //            // Take the sensors from the certain host only
        //            .Where(ts => host == null || ts.Host.Contains(host))
        //            .OrderBy(ts => ts.Address)
        //            .Select(ts => new { Location = ts, ts.Sensor })
        //            .GroupBy(s => new { s.Location.Host, s.Location.Port });
        //        DateTime startTime = startAt ?? DateTime.UtcNow + TimeSpan.FromSeconds(10);
        //        DateTime execTime = startTime;
        //        int maxSensorCount = ports.Max(p => p.Count());
        //        var result = new List<Record>();

        //        foreach (var commandPlan in profile.ProfileCommands.OrderBy(cp => cp.Order))
        //        {
        //            var instructions = commandPlan.Command.CommandInstructions
        //                .Select(ci => new { Plan = ci, ci.Instruction })
        //                .OrderBy(p => p.Plan.Order)
        //                .ToList();
        //            var commandDuration = instructions
        //                .Select(i => (i.Instruction.IsAddressing ? maxSensorCount : 1) *
        //                    (i.Plan.DelayBefore.TotalMilliseconds + InstructionDuration + i.Plan.DelayAfter.TotalMilliseconds))
        //                .Sum();
        //            execTime = execTime.AddMilliseconds(commandPlan.StartAfter);
        //            var endTime = execTime.AddMilliseconds(Math.Max(commandPlan.EndAfter, commandDuration));
        //            var onceMore = true;
        //            while (execTime < endTime && onceMore)
        //            {
        //                onceMore = commandPlan.IsLooped;
        //                var locExecTime = default(DateTime);
        //                var index = 0;
        //                foreach (var port in ports)
        //                {
        //                    // Make a tiny interval between com ports polling to smooth processor usage
        //                    locExecTime = execTime.AddMilliseconds(100 * index++);

        //                    foreach (var instruction in instructions)
        //                    {
        //                        var instr = instruction.Instruction;
        //                        var funcParams = FunctionHelper.GetFunctionParameters(instr.Name);
        //                        var parameters = ExtractParameters(instr.Name, instr.GetParameters(funcParams), instr.Parameters, instruction.Plan.Parameters, commandPlan.Parameters);

        //                        if (instr.IsAddressing)
        //                        {
        //                            foreach (var sensor in port)
        //                            {
        //                                locExecTime = locExecTime.Add(instruction.Plan.DelayBefore);
        //                                result.Add(new Record
        //                                {
        //                                    TestSensorId = sensor.Location.Id,
        //                                    Host = sensor.Location.Host,
        //                                    Port = sensor.Location.Port,
        //                                    BaudRate = sensor.Location.BaudRate,
        //                                    Address = sensor.Location.Address,
        //                                    InstructionId = instr.Id,
        //                                    Instruction = instr,
        //                                    StageId = stage.Id,
        //                                    ScheduledAt = locExecTime,
        //                                    Parameters = parameters,
        //                                    DeviceType = DeviceType.Testing.ToString()
        //                                });
        //                                locExecTime = locExecTime.AddMilliseconds(InstructionDuration);
        //                                locExecTime = locExecTime.Add(instruction.Plan.DelayAfter);
        //                            }
        //                        }
        //                        else
        //                        {
        //                            locExecTime = locExecTime.Add(instruction.Plan.DelayBefore);
        //                            result.Add(new Record
        //                            {
        //                                Host = port.Key.Host,
        //                                Port = port.Key.Port,
        //                                BaudRate = port.FirstOrDefault().Location.BaudRate,
        //                                InstructionId = instr.Id,
        //                                Instruction = instr,
        //                                StageId = stage.Id,
        //                                ScheduledAt = locExecTime,
        //                                Parameters = parameters,
        //                                DeviceType = DeviceType.Testing.ToString()
        //                            });
        //                            locExecTime = locExecTime.AddMilliseconds(InstructionDuration);
        //                            locExecTime = locExecTime.Add(instruction.Plan.DelayAfter);
        //                        }
        //                    }
        //                }
        //                // Next start point right after loop ended, next loop otherwise
        //                var nextCommandTime = commandPlan.IsLooped ? execTime.AddMilliseconds(Math.Max(commandPlan.LoopDelay.TotalMilliseconds, commandDuration)) : endTime;
        //                nextCommandTime = locExecTime > nextCommandTime ? locExecTime : nextCommandTime;
        //                execTime = nextCommandTime;
        //            }
        //            //execTime = /*execTime > endTime ? execTime : */endTime;
        //        }

        //        return result;
        //    }
        //}

        //private static string ExtractParameters(string instrName, IEnumerable<string> paramNames, params string[] parameters)
        //{
        //    string result = null;
        //    var joinParams = Regex.Replace(string.Join(",", parameters.Where(s => !string.IsNullOrEmpty(s))), @"(?<Param>\{\w+?\})", @"'${Param}'");
        //    var allParams = JsonConvert.DeserializeObject<Dictionary<string, object>>($"{{{joinParams}}}");
        //    if (allParams.Count > 0)
        //    {
        //        var dic = new Dictionary<string, object>();
        //        var pattern = $"{instrName}_";
        //        foreach (var p in paramNames)
        //        {
        //            if (allParams.ContainsKey($"{pattern}{p}"))
        //            {
        //                dic[p] = allParams[$"{pattern}{p}"];
        //            }
        //            else if (allParams.ContainsKey(p))
        //            {
        //                dic[p] = allParams[p];
        //            }
        //        }

        //        if (dic.Count > 0)
        //        {
        //            result = JsonConvert.SerializeObject(dic);
        //        }
        //    }

        //    return result;
        //}

        //public static IEnumerable<Record> GetGasProfilePlan(string connectionString,
        //    int stageId, string host, DateTime? startAt = null)
        //{
        //    using (var db = new EdmContext(connectionString))
        //    {
        //        // TODO Just a single gas device per stage is allowed at the moment
        //        var device = db.StageDevices.AsNoTracking()
        //            .Include(sd => sd.HostDevice.Device)
        //            .Include(sd => sd.HostDevice.Host)
        //            .Where(sd => sd.StageId == stageId && ((int) DeviceType.Gas & (int) sd.HostDevice.Device.Type) != 0 && sd.HostDevice.Host.Name == host)
        //            .Select(sd => sd.HostDevice.Device)
        //            .FirstOrDefault() ?? throw new Exception($"Cannot find gas device for stage {stageId}");

        //        var profile = db.Stages
        //                .Include(s => s.GasProfile)
        //                .Include(p => p.GasProfile.Points)
        //                .Single(s => s.Id == stageId)
        //            .GasProfile;
        //        if (profile == null)
        //        {
        //            throw new Exception($"No gas profile found for stage {stageId}");
        //        }

        //        return CreateProfilePlan(device, profile, stageId, host, startAt);
        //    }
        //}

        //public static Profile GetThermProfile(string connectionString, int stageId)
        //{
        //    using (var db = new EdmContext(connectionString))
        //    {
        //        var profile = db.Stages
        //            .Include(s => s.TemperatureProfile)
        //            .Include(p => p.TemperatureProfile.Points)
        //            .Single(s => s.Id == stageId)
        //            .TemperatureProfile;
        //        if (profile == null)
        //        {
        //            throw new Exception($"No thermal profile found for stage {stageId}");
        //        }

        //        return profile;
        //    }
        //}

        //public static IEnumerable<Record> GetThermProfilePlan(string connectionString, int stageId, string host, DateTime? startAt = null)
        //{
        //    using (var db = new EdmContext(connectionString))
        //    {
        //        // TODO Just a single therm device per stage is allowed at the moment
        //        var device = db.StageDevices.AsNoTracking()
        //            .Include(sd => sd.HostDevice.Device)
        //            .Include(sd => sd.HostDevice.Host)
        //            .Where(sd => sd.StageId == stageId && ((int) DeviceType.Temperature & (int) sd.HostDevice.Device.Type) != 0 && sd.HostDevice.Host.Name == host)
        //            .Select(sd => sd.HostDevice.Device)
        //            .FirstOrDefault() ?? throw new Exception($"Cannot find thermal device for stage {stageId}");
        //        var profile = GetThermProfile(connectionString, stageId);
        //        return CreateProfilePlan(device, profile, stageId, host, startAt);
        //    }
        //}

        //public static IEnumerable<Record> CreateProfilePlan(Device device, Profile profile, int stageId, string host, DateTime? startAt = null)
        //{

        //    var startTime = startAt ?? DateTime.UtcNow + TimeSpan.FromSeconds(10);
        //    var plan = new List<Record>();
        //    var type = ((int) DeviceType.Gas & (int) device.Type) != 0 ? DeviceType.Gas :
        //        ((int) DeviceType.Temperature & (int) device.Type) != 0 ? DeviceType.Temperature :
        //            DeviceType.None;
        //    Record GetAction(TimeSpan o, string a, decimal? p = null) => new Record
        //    {
        //        // TODO Host is just just a stub as a single device per stage allowed
        //        Host = host,
        //        Request = a,
        //        Parameters = p?.ToString("F"),
        //        StageId = stageId,
        //        DeviceType = type.ToString(),
        //        ScheduledAt = startTime + o
        //    };

        //    var points = profile.Points.OrderBy(p => p.Order).ToArray();
        //    if (points.Any())
        //    {
        //        var offset = points[0].Offset;
        //        plan.Add(GetAction(offset - TimeSpan.FromSeconds(2), nameof(IDeviceDriver.Start)));
        //        plan.Add(GetAction(offset, nameof(IDeviceDriver.Set), points[0].Value));
        //        for (int i = 1; i < points.Length; i++)
        //        {
        //            var curr = points[i];
        //            var next = i < points.Length - 1 ? points[i + 1] : null;
        //            offset += curr.Offset;
        //            if (next == null)
        //            {
        //                break;
        //            }


        //            if (curr.Value != next.Value)
        //            {
        //                if (((int) DeviceType.Gas & (int) device.Type) != 0) // Gas device
        //                {
        //                    // Single step elevation 
        //                    plan.Add(GetAction(offset, nameof(IDeviceDriver.Set), next.Value));
        //                }
        //                else if (((int) DeviceType.Temperature & (int) device.Type) != 0) // Termal device
        //                {
        //                    // Emulate ramp elevation 
        //                    var interval = 30; //sec
        //                    double nextOffset = next.Offset.TotalSeconds;
        //                    int stepsCount = (int) nextOffset / interval + 1; // At least one step
        //                    double stepInterval = nextOffset / stepsCount;
        //                    decimal stepValue = (next.Value - curr.Value) / stepsCount;
        //                    for (int step = 0; step < stepsCount; step++)
        //                    {
        //                        var rampOffset = offset + TimeSpan.FromSeconds(step * stepInterval);
        //                        var rampValue = curr.Value + (step + 1) * stepValue;
        //                        plan.Add(GetAction(rampOffset, nameof(IDeviceDriver.Set), rampValue));
        //                    }
        //                }
        //            }
        //        }

        //        plan.Add(GetAction(offset + TimeSpan.FromSeconds(2), nameof(IDeviceDriver.Stop)));
        //        // Add pinging device every 10 seconds
        //        var pingOffset = points[0].Offset + TimeSpan.FromSeconds(10);
        //        while (pingOffset < offset)
        //        {
        //            plan.Add(GetAction(pingOffset, nameof(IDeviceDriver.Ping)));
        //            pingOffset += TimeSpan.FromSeconds(10);
        //        }
        //    }
        //    return plan.OrderBy(p => p.ScheduledAt).ToList();
        //}
    }
}
