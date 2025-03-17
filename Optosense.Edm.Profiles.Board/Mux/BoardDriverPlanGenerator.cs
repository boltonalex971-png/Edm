using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Optosense.Edm.Profiles.Board;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Dynamic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers.Mux
{
    public class BoardDriverPlanGenerator
    {
        public IEnumerable<DriverRequest> GetTestPlan(string profileJson, string paramJson)
        {
            if (profileJson == null)
            {
                throw new EdmException("Profile JSON representation is empty");
            }

            var profile = JsonConvert.DeserializeObject<BoardProfile>(profileJson);
            var availableParams = JsonConvert.DeserializeObject<Dictionary<string,object>>(paramJson ?? "{}");
            var profileRequiredParams = GetRequiredParams(profile);

            // TODO Check if skipped parameter is in instruction args
            //var profileParamSkipped = profileRequiredParams
            //    .Where(p => ((IDictionary<string, object>) availableParams)[p] == null)
            //    .ToList();
            //if (profileParamSkipped.Any())
            //{
            //    throw new EdmException($"Profile parameters [{string.Join(", ", profileParamSkipped)}] must be provided");
            //}

            var offset = 0;
            foreach (var command in profile.OrderBy(c => c.Order))
            {
                var commandInstructions = command.Instructions
                    .OrderBy(i => i.Order)
                    //.Select(i => i.Instruction)
                    .ToList();
                var requiredParams = GetRequiredParams(commandInstructions.Select(ci => ci.Instruction));
                var iteratedParam = availableParams
                    .Where(p => requiredParams.Contains(p.Key) && p.Value is IEnumerable)
                    .FirstOrDefault();
                if (iteratedParam.Key is null)
                {
                    iteratedParam = KeyValuePair.Create("None", (object)Enumerable.Range(0, 1));
                }

                offset += command.Offset * 1000 * 60; // Command offset in minutes
                foreach (var iterParam in iteratedParam.Value as IEnumerable)
                {
                    foreach (var ci in commandInstructions)
                    {
                        var purifiedArgs = Regex.Replace(ci.Args ?? string.Empty, @"{([\w\d]+)\?*}", @"""{$1}""");
                        var args = JsonConvert.DeserializeObject<Dictionary<string, object>>($"{{{purifiedArgs}}}");
                        var reqs = Regex.Matches(ci.Args ?? string.Empty, @"{([\w\d]*)\?{1}}").Select(m => m.Groups[1].Value);
                        var instParams = GetRequiredParams(ci.Instruction)
                            .Select(p => KeyValuePair
                                .Create(p, p == iteratedParam.Key ? iterParam 
                                    : availableParams.ContainsKey(p) ? availableParams[p] : args[p]))
                            .ToDictionary(p => p.Key, p => p.Value);
                        yield return new BoardDriverRequest
                        {
                            Offset = offset,
                            Command = ci.Instruction.Code,
                            Parameters = JsonConvert.SerializeObject(instParams),
                            Instruction = ci.Instruction,
                            Condition = reqs.Any() ? string.Join(",", reqs) : null
                        };
                        // Delay before to start new instruction
                        offset += ci.Instruction.Timeout;
                    }
                }
            }

            yield return new DriverRequest
            {
                Offset = offset + 100,
                Condition = "1", // Wait a second before stop to give a chance to complete related services
                Command = "Stop",
            };
        }

        internal IEnumerable<string> GetRequiredParams(IEnumerable<Command> commands)
        {
            var param = commands
                .SelectMany(c => GetRequiredParams(c.Instructions.Select(i => i.Instruction)))
                .Distinct()
                .ToList();
            return param;
        }

        internal IEnumerable<string> GetRequiredParams(IEnumerable<Instruction> instructions)
        {
            var param = instructions
                .SelectMany(i => GetRequiredParams(i))
                .Distinct()
                .ToList();
            return param;
        }
        internal IEnumerable<string> GetRequiredParams(Instruction instruction)
        {
            var regex = new Regex(@"{(\w*)}");
            var param = regex.Matches(instruction.Code)
                .Select(m => m.Groups[1].Value)
                .Distinct()
                .ToList();
            return param;
        }

        internal IEnumerable<string> GetRequestedParams(CommandInstruction commandInstruction)
        {
            
            var regex = new Regex(@"{(\w*)\?}");
            var param = regex.Matches(commandInstruction.Args)
                .Select(m => m.Groups[1].Value)
                .Distinct()
                .ToList();
            return param;
        }
    }
}

