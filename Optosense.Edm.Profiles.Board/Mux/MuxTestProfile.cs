using Optosense.Edm.Profiles.Board;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers.Mux
{
    public class MuxTestProfile
    {
        public IEnumerable<BoardDriverRequest> Profile { get; }

        public MuxTestProfile()
        {
            Profile = Generate();
        }

        private IEnumerable<BoardDriverRequest> Generate()
        {
            var offset = 900;
            var instructions = new Instruction[] 
            { 
               new Instruction { Name = "TABTINIT", Code = "{ADDR}TABTINIT", Syntax = "10000.0", Timeout = 200, Retries = 0 },
               new Instruction { Name = "ZERO1", Code = "{ADDR}ZERO1", Syntax = "ZERO1 OK", Timeout = 200, Retries = 0 },
               new Instruction { Name = "F", Code = "{ADDR}F", 
                   Syntax = @"\x0E(?<Term0>\d{5})\t(?<S0>\d{5})\t(?<Signal>\d{5})\t(?<Ref>\d{5})\t(?<S0z>\d{5})\t(?<Stz>\d{5})\t(?<Stzkt>\d{5})\t(?<Conc>[-\d]\d{4})\t(?<Conc1>[-\d]\d{4})\t(?<Status>\d{5})\t(?<Sn>\d{8})\t(?<ControlSum>.)\t\r$", 
                   Timeout = 200, Retries = 2 },
               new Instruction { Name = "PW?", Code = "{ADDR}PW?", Syntax = @"(?<Icons>\d{5})", Timeout = 60000, Retries = 2 },
               new Instruction { Name = "@*0", Code = "@*0", Syntax = "", Timeout = 1000, Retries = 0 },

            };
            for (int addr = 0; addr < 20; addr++)
            {
                foreach (var inst in instructions)
                {
                    yield return new BoardDriverRequest 
                    { 
                        Offset = offset + 100, 
                        Command = $"{inst.Code}", 
                        Parameters = $"{{\"ADDR\":\"#{addr:X2}\"}}",
                        Instruction = inst
                    };
                    offset = 0;
                }

                offset = 600;
            }

        }
    }
}
