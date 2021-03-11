using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Grpc.Net.Client;
using Microprojects.Edm;
using Microprojects.Edm.Commands;
using Newtonsoft.Json;
using Optosense.Edm.Commands;
using Optosense.Edm.Core.Infrastructure;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Infrastructure.Edm.Commands;
using Optosense.Edm.WebApi;

namespace Optosense.Edm.Infrastructure.Edm
{
    public class RemoteCommands : IRemoteCommands
    {
        private IEdmContext _context;
        private ICommandContainer _commands;

        public RemoteCommands(IEdmContext context, ICommandContainer commands)
        {
            _context = context;
            _commands = commands;
        }

        public async Task<string> Execute(string host, ICommand command)
        {
            if (command == null)
            {
                throw new Exception("Command name and parameters cannot be null");
            }

            var response = await command.RemoteExecute(host);
            return response.Response;
        }

        public async Task<string> StartDevice(
            int linkId,
            string url,
            dynamic options,
            string profile,
            Guid driverGuid,
            DateTime startAt)
        {
            var deviceParams = new StartDeviceCommandParameters
            {
                Driver = driverGuid,
                DriverOptions = options,
                OperationHostDevice = linkId,
                StartAt = startAt,
                Profile = profile
            };
            var deviceCommand = new StartDeviceCommand { CommandParameters = deviceParams };
            var response = await deviceCommand.RemoteExecute(url);

            return response.Response;
        }

        public async Task<string> StartOperation(int operationId, DateTime startAt)
        {
            var parameters = new StartOperationCommandParameters
            {
                CacheConnectionString = "localhost;abortConnect=false",
                DbConnectionString = "Data Source=.\\SQLEXPRESS;MultipleActiveResultSets=true;Initial Catalog=optosense_edm;Integrated Security=SSPI;",
                Operation = operationId,
                StartAt = startAt
            };
            var response = await _commands.Execute(
                new CommandData
                {
                    Command = "StartOperation",
                    Params = $@"{JsonConvert.SerializeObject(parameters)}"
                });
            return response.Response;
        }

        public async Task<string> StartTestOperation(int operationId, DateTime startAt)
        {
            var parameters = new StartOperationCommandParameters
            {
                CacheConnectionString = "localhost;abortConnect=false",
                DbConnectionString = "Data Source=.\\SQLEXPRESS;MultipleActiveResultSets=true;Initial Catalog=optosense_edm;Integrated Security=SSPI;",
                Operation = operationId,
                StartAt = startAt
            };
            var response = await _commands.Execute(
                new CommandData
                {
                    Command = "StartOperation",
                    Params = $@"{JsonConvert.SerializeObject(parameters)}"
                });
            return response.Response;
        }

        public async Task<string> CancelOperation(int operationId)
        {
            // TODO make _command.Execute with ICommand as parameter

            //var parameters = new StartOperationCommandParameters
            //{
            //    Operation = operationId
            //};
            //var command = new StopCommand(new StartOperationCommand
            //{
            //    CommandParameters = parameters
            //});
            var response = await _commands.Execute(new CommandData
            {
                Command = "Stop",
                Params = JsonConvert.SerializeObject(new { Command = "StartOperation", Operation = operationId})
            });
            if (response.Status != "Ok")
            {
                throw new EdmException(response.Message);
            }
            return response.Response;
        }
    }
}
