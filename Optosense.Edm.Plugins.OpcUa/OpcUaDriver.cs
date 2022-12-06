using System;
using System.Collections.Generic;
using System.Dynamic;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Microprojects.Edm;
using Microprojects.Edm.Drivers;
using Newtonsoft.Json;
using Opc.Ua.Configuration;
using Opc.Ua;
using Opc.Ua.Client;
using static System.Collections.Specialized.BitVector32;
using System.Security.Policy;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Threading;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Internal;

namespace Optosense.Edm.Drivers.OpcUa
{
    [Driver(OptionsType = typeof(OpcUaDriverOptions))]
    public class OpcUaDriver : DriverBase, IReactiveDriver
    {
        public Func<DriverResponse, bool, Task> PushResponse { get; set; }
        protected OpcUaDriverOptions OpcUaOptions => (OpcUaDriverOptions)Options;
        protected Session Session { get; set; }
        protected Subscription Subscription { get; set; }
        protected DateTime StartTimestamp { get; set; }
        protected ApplicationConfiguration DefaultApplicationConfiguration { get; init; } = new ApplicationConfiguration
        {
            ApplicationName = "Optosenese ISTP Client",
            ApplicationUri = "urn:localhost:Optosense:ISTPClient",
            ProductUri = "http://optosense.com/ISTP/IstpClient",
            ApplicationType = ApplicationType.Client,
            ClientConfiguration = new ClientConfiguration
            {
                DefaultSessionTimeout = 600000,
                WellKnownDiscoveryUrls = new[] { "opc.tcp://{0}:4840/UADiscovery" },
                MinSubscriptionLifetime = 10000
            },
            TransportQuotas = new TransportQuotas
            {
                OperationTimeout = 600000,
                MaxStringLength = 1048576,
                MaxByteStringLength = 4194304,
                MaxArrayLength = 65535,
                MaxMessageSize = 4194304,
                MaxBufferSize = 65535,
                ChannelLifetime = 300000,
                SecurityTokenLifetime = 3600000
            },
            DisableHiResClock = true
        };

        public OpcUaDriver()
        {
            Options = new OpcUaDriverOptions();
        }

        public OpcUaDriver(OpcUaDriverOptions p)
        {
            Options = p;
        }

        public override string Init()
        {
            ApplicationInstance application = new ApplicationInstance
            {
                ApplicationName = "Optosense ISTP Client",
                ApplicationType = ApplicationType.Client,
                ApplicationConfiguration = DefaultApplicationConfiguration
            };

            var selectedEndpoint = CoreClientUtils.SelectEndpoint(OpcUaOptions.Endpoint, false, 15000);
            var endpointConfiguration = EndpointConfiguration.Create(application.ApplicationConfiguration);
            var endpoint = new ConfiguredEndpoint(null, selectedEndpoint, endpointConfiguration);
            var session = Session.Create(
                application.ApplicationConfiguration, endpoint, false,
                application.ApplicationName, 60000,
                new UserIdentity(new AnonymousIdentityToken()), null);

            session.Wait();
            Session = session.Result;
            return OK;
        }

        public override string Start()
        {
            Subscription = new Subscription(Session.DefaultSubscription) { PublishingInterval = 1000 };

            var list = new List<MonitoredItem>(OpcUaOptions.Output
                .Select(o => new MonitoredItem(Subscription.DefaultItem)
                {
                    DisplayName = o.Text,
                    StartNodeId = o.Value
                }));
            list.ForEach(i => i.Notification += OnNotification);
            Subscription.AddItems(list);

            Session.AddSubscription(Subscription);
            Subscription.Create();

            return OK;
        }

        public override string Stop()
        {
            if (Subscription != null)
            {
                Session.RemoveSubscription(Subscription);
            }

            Session.Close();
            return OK;
        }

        private void OnNotification(MonitoredItem item, MonitoredItemNotificationEventArgs e)
        {
            var outputName = OpcUaOptions.Output.FirstOrDefault(o => o.Value == item.StartNodeId.ToString())?.Text ??
                throw new ArgumentException("Cannot translate to output parameter", item.DisplayName);
            foreach (var value in item.DequeueValues())
            {
                if (PushResponse is not null)
                {
                    var param = new ExpandoObject();
                    param.TryAdd(outputName, value.Value);
                    var response = new DriverResponse
                    {
                        Executed = (long)(value.SourceTimestamp - StartTimestamp).TotalMilliseconds,
                        Planned = (long)(value.SourceTimestamp - StartTimestamp).TotalMilliseconds,
                        Parameters = JsonConvert.SerializeObject(param),
                        State = DriverResponseState.Ok,
                        Request = item.DisplayName,
                        Response = $"{outputName} = \"{value.Value}\""
                    };
                    PushResponse(response, false);
                }
                else
                {
                    Debug.WriteLine("{0}: {1}, {2}, {3}", item.DisplayName, value.Value, value.SourceTimestamp, value.StatusCode);
                }
            }
        }

        public async Task<object> GetNode(NodeId id)
        {
            Node node = new();
            DataValue value = default;
            try
            {
                node = id.IsNullNodeId ? node : await Session.ReadNodeAsync(id);
                if (node.NodeClass == NodeClass.Variable)
                {
                    value = id.IsNullNodeId || node.NodeClass != NodeClass.Variable ? null : await Session.ReadValueAsync(id);
                }
            }
            catch
            {
                // Just swallow exception as most likely we can't read a value of the node
            }

            return new { value, node.TypeId, node.Description, node.DisplayName, node.NodeId, node.NodeClass };
        }

        public IEnumerable<object> GetChildNodes(NodeId id)
        {
            //var nodes = await Session.BrowseAsync(null, null, 100, id, CancellationToken.None);
            id = id ?? ObjectIds.ObjectsFolder;
            Session.Browse(
                null,
                null,
                id.IsNullNodeId ? ObjectIds.ObjectsFolder : id,
                0u,
                BrowseDirection.Forward,
                ReferenceTypeIds.HierarchicalReferences,
                true,
                (uint)NodeClass.Variable | (uint)NodeClass.Object | (uint)NodeClass.Method,
                out var continuationPoint,
                out var references);
            var nodes = references.Select(r => new
            {
                Name = r.DisplayName.Text,
                Id = ExpandedNodeId.ToNodeId(r.NodeId, Session.NamespaceUris).ToString(),
                Items = new[] { new { Name = "Loading..." } }
            });

            return nodes;
        }

        //internal IEnumerable<string> GetEndpoints(string url)
        //{

        //}
    }

    public class OpcUaDriverOptions : IDriverOptions
    {
        public string Endpoint { get; set; } = "opc.tcp://localhost:51210/UA/SampleServer";
        public IEnumerable<Output> Output { get; set; }
    }

    public class Output
    {
        public string Text { get; set; }
        public string Value { get; set; }
    }
}
