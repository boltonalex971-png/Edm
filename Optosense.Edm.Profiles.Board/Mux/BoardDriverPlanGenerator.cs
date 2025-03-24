using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reactive.Linq;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Optosense.Edm.Profiles.Board;

namespace Optosense.Edm.Drivers.Mux
{
    public partial class BoardDriverPlanGenerator
    {
        public IEnumerable<DriverRequest> GetTestPlan(string profileJson, string paramJson)
        {
            if (profileJson == null)
            {
                throw new EdmException("Profile JSON representation is empty");
            }

            var profile = JsonConvert.DeserializeObject<BoardProfile>(profileJson);
            var availableParams = JsonConvert.DeserializeObject<Dictionary<string,object>>(paramJson ?? "{}");
            
            // TODO Check if skipped parameter is in instruction args
            //var profileParamSkipped = profileRequiredParams
            //    .Where(p => ((IDictionary<string, object>) availableParams)[p] == null)
            //    .ToList();
            //if (profileParamSkipped.Any())
            //{
            //    throw new EdmException($"Profile parameters [{string.Join(", ", profileParamSkipped)}] must be provided");
            //}

            foreach (var command in profile.OrderBy(c => c.Order))
            {
                var commandInstructions = command.Instructions
                    .OrderBy(i => i.Order)
                    .ToList();
                var requiredParams = GetRequiredParams(commandInstructions.Select(ci => ci.Instruction));
                var iteratedParam = availableParams
                    .FirstOrDefault(p => requiredParams.Contains(p.Key) && p.Value is IEnumerable);
                if (iteratedParam.Key is null)
                {
                    iteratedParam = KeyValuePair.Create("None", (object)Enumerable.Range(0, 1));
                }

                var offset = command.Offset * 60 * 1000; // Command offset in minutes
                foreach (var iterParam in (IEnumerable)iteratedParam.Value)
                {
                    foreach (var ci in commandInstructions)
                    {
                        var purifiedArgs = PurifiedArgsRegex()
                            .Replace(ci.Args ?? string.Empty, @"""{$1}""");
                        var args = JsonConvert.DeserializeObject<Dictionary<string, object>>($"{{{purifiedArgs}}}");
                        var reqs = RequiredArgsRegex().Matches(ci.Args ?? string.Empty)
                            .Select(m => m.Groups[1].Value)
                            .ToArray();
                        var instParams = GetRequiredParams(ci.Instruction)
                            .Select(p => KeyValuePair
                                .Create(p, p == iteratedParam.Key ? 
                                    iterParam : 
                                    availableParams.TryGetValue(p, out var param) ? param : args[p]))
                            .ToDictionary(p => p.Key, p => p.Value);
                        yield return new BoardDriverRequest
                        {
                            Offset = offset,
                            Command = ci.Instruction.Code,
                            Parameters = JsonConvert.SerializeObject(instParams),
                            Instruction = ci.Instruction,
                            // Condition offset in seconds
                            // Instruction offset in milliseconds
                            Condition = reqs.Length != 0 ? string.Join(",", reqs) : null
                        };
                        // Delay before start new instruction
                        offset = ci.Offset ?? 1000;
                    }
                }
            }

            yield return new DriverRequest
            {
                Offset = 1000,
                Command = "Stop",
            };
        }

        public async IAsyncEnumerable<DriverRequest> GetAsyncPlan(string profileJson, string paramJson,
            DateTime startedAt, [EnumeratorCancellation] CancellationToken ct = default)
        {
            if (profileJson == null)
            {
                throw new EdmException("Profile JSON representation is empty");
            }

            var profile = JsonConvert.DeserializeObject<BoardProfile>(profileJson);
            var availableParams = JsonConvert.DeserializeObject<Dictionary<string,object>>(paramJson ?? "{}");
            
            // TODO Check if skipped parameter is in instruction args
            //var profileParamSkipped = profileRequiredParams
            //    .Where(p => ((IDictionary<string, object>) availableParams)[p] == null)
            //    .ToList();
            //if (profileParamSkipped.Any())
            //{
            //    throw new EdmException($"Profile parameters [{string.Join(", ", profileParamSkipped)}] must be provided");
            //}

            // Offset is used just to specify the interval from iteration start to execution planned time 
            var offset = 0;
            var scheduledAt = startedAt;
            foreach (var command in profile.OrderBy(c => c.Order))
            {
                var commandInstructions = command.Instructions
                    .OrderBy(i => i.Order)
                    .ToList();
                var requiredParams = GetRequiredParams(commandInstructions.Select(ci => ci.Instruction));
                var iteratedParam = availableParams
                    .FirstOrDefault(p => requiredParams.Contains(p.Key) && p.Value is IEnumerable);
                if (iteratedParam.Key is null)
                {
                    iteratedParam = KeyValuePair.Create("None", (object)Enumerable.Range(0, 1));
                }

                offset += command.Offset;
                scheduledAt = scheduledAt.AddMinutes(command.Offset);
                foreach (var iterParam in (IEnumerable)iteratedParam.Value)
                {
                    foreach (var ci in commandInstructions)
                    {
                        ct.ThrowIfCancellationRequested();
                        var purifiedArgs = PurifiedArgsRegex()
                            .Replace(ci.Args ?? string.Empty, @"""{$1}""");
                        var args = JsonConvert.DeserializeObject<Dictionary<string, object>>($"{{{purifiedArgs}}}");
                        var reqs = RequiredArgsRegex().Matches(ci.Args ?? string.Empty)
                            .Select(m => m.Groups[1].Value)
                            .ToArray();
                        var instParams = GetRequiredParams(ci.Instruction)
                            .Select(p => KeyValuePair
                                .Create(p, p == iteratedParam.Key ? 
                                    iterParam : 
                                    availableParams.TryGetValue(p, out var param) ? param : args[p]))
                            .ToDictionary(p => p.Key, p => p.Value);
                        offset += ci.Offset ?? 100;
                        scheduledAt = scheduledAt.AddMilliseconds(ci.Offset ?? 100);
                        var current = DateTime.UtcNow;
                        var next = (scheduledAt - current).TotalMilliseconds;
                        // Wait until proper time or minimal gap before start instruction 
                        var delay = next < (ci.Gap ?? 0) ? ci.Gap ?? 0 : next;
                        await Task.Delay((int)delay, ct);
                        yield return new BoardDriverRequest
                        {
                            Offset = offset,
                            Command = ci.Instruction.Code,
                            Parameters = JsonConvert.SerializeObject(instParams),
                            Instruction = ci.Instruction,
                            Condition = reqs.Length != 0 ? string.Join(",", reqs) : null
                        };
                    }
                }
            }

            yield return new DriverRequest
            {
                Offset = offset + 1000,
                Command = "Stop",
            };
        }

        private IEnumerable<string> GetRequiredParams(IEnumerable<Command> commands)
        {
            var param = commands
                .SelectMany(c => GetRequiredParams(c.Instructions.Select(i => i.Instruction)))
                .Distinct()
                .ToList();
            return param;
        }

        private IEnumerable<string> GetRequiredParams(IEnumerable<Instruction> instructions)
        {
            var param = instructions
                .SelectMany(GetRequiredParams)
                .Distinct()
                .ToList();
            return param;
        }

        private IEnumerable<string> GetRequiredParams(Instruction instruction)
        {
            var regex = new Regex(@"{(\w*)}");
            var param = regex.Matches(instruction.Code)
                .Select(m => m.Groups[1].Value)
                .Distinct()
                .ToList();
            return param;
        }

        private IEnumerable<string> GetRequiredParams(CommandInstruction commandInstruction)
        {
            
            var regex = new Regex(@"{(\w*)\?}");
            var param = regex.Matches(commandInstruction.Args)
                .Select(m => m.Groups[1].Value)
                .Distinct()
                .ToList();
            return param;
        }

        [GeneratedRegex(@"{([\w\d]+)\?*}")]
        private static partial Regex PurifiedArgsRegex();
        [GeneratedRegex(@"{([\w\d]*)\?{1}}")]
        private static partial Regex RequiredArgsRegex();
    }
}

