using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Profiles.Board
{
    public class BoardProfile : List<Command>
    {
    }

    public class Command
    {
        public int Order { get; set; }
        public string Name { get; set; }
        public int Offset { get; set; }
        public int Duration { get; set; }
        public bool IsLoop { get; set; }
        public bool Repeat { get; set; }
        public List<CommandInstruction> Instructions { get; set; }
    }

    public class CommandInstruction
    {
        public int Order { get; set; }

        /// <summary>
        /// Offset between launches of sequential instructions, in milliseconds
        /// </summary>
        public int? Offset { get; set; }

        /// <summary>
        /// Minimal gap between sequential instructions, in milliseconds
        /// </summary>
        public int? Gap { get; set; }
        public string Args { get; set; }
        public Instruction Instruction { get; set; }
    }

    public class Instruction
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public required string Code { get; set; }
        public string Syntax { get; set; }
        public int? Length { get; set; }
        public int? Timeout { get; set; }
        public int? Retries { get; set; }
        public bool MultiLineResponse { get; set; }
    }
}

