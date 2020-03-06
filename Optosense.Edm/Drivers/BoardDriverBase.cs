using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Utils;

namespace Optosense.Edm.Drivers
{
    [Driver(DeviceType = DeviceModel.Board, OptionsType = typeof(BoardDriverOptions))]
    public class BoardDriverBase : DriverBase
    {
        protected BoardDriverOptions BoardOptions => (BoardDriverOptions) Options;
        protected SerialPort Port { get; set; }

        public BoardDriverBase() { }

        public BoardDriverBase(BoardDriverOptions p)
        {
            Options = p;
        }

        public override string Init()
        {
            Port = new SerialPort(BoardOptions.Port, BoardOptions.Baudrate);
            Port.Open();
            return Ok;
        }

        public override string Execute(string command)
        {
            var response = new string(Port.Request(
                command,
                responseLength: 0,
                singleLine: true,
                timeout: 500));

            //var isResponseValid = string.IsNullOrEmpty(x.Instruction.SyntaxTemplate) ||
            //                      response.Trim() == SubstituteParameters(x.Instruction.SyntaxTemplate, parameters) ||
            //                      Regex.IsMatch(
            //                         response,
            //                         SubstituteParameters(x.Instruction.SyntaxTemplate, parameters, asBytes: true),
            //                         x.Instruction.IsSingleLineResponse ? RegexOptions.Singleline : RegexOptions.Multiline);
            //if (!isResponseValid)
            //{
            //    throw new FunctionException("Response is not valid");
            //}

            return response;
        }

        public override void Dispose()
        {
            if (Port != null && Port.IsOpen) Port.Close();
            Port.Dispose();
        }
    }

    public class BoardDriverOptions : DriverOptions
    {
        public string Port { get; set; }
        public int Baudrate { get; set; } = 9600;
        public int DataBits { get; set; } = 8;
        public int Timeout { get; set; } = 1200;
    }
}
