using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Profiles.Board;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Dynamic;
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
            var availableParams = JsonConvert.DeserializeObject<ExpandoObject>(paramJson ?? "{}");
            var profileRequiredParams = GetRequiredParams(profile);
            var profileParamSkipped = profileRequiredParams
                .Where(p => ((IDictionary<string, object>) availableParams)[p] == null)
                .ToList();
            if (profileParamSkipped.Any())
            {
                throw new EdmException($"Profile parameters [{string.Join(", ", profileParamSkipped)}] must be provided");
            }

            foreach (var command in profile.OrderBy(c => c.Order))
            {
                var instructions = command.Instructions
                    .OrderBy(i => i.Order)
                    .Select(i => i.Instruction)
                    .ToList();
                var requiredParams = GetRequiredParams(instructions);
                var iteratedParam = availableParams
                    .FirstOrDefault(p => requiredParams.Contains(p.Key) && p.Value is IEnumerable);
                var parameters = availableParams
                    .Where(p => requiredParams.Contains(p.Key));
                var offset = command.Offset;
                foreach (var iterParam in iteratedParam.Value as IEnumerable)
                {
                    foreach (var inst in instructions)
                    {
                        var instParams = GetRequiredParams(inst)
                            .Select(p => KeyValuePair
                                .Create(p, p == iteratedParam.Key ? iterParam : ((IDictionary<string, object>) availableParams)[p]))
                            .ToDictionary(p => p.Key, p => p.Value);
                        yield return new BoardDriverRequest
                        {
                            Offset = offset,
                            Command = inst.Code,
                            Parameters = JsonConvert.SerializeObject(instParams),
                            Instruction = inst
                        };
                        offset = inst.Timeout;
                    }
                }
            }
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
    }
}

