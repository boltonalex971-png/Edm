using Newtonsoft.Json;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm
{
    public class Hive
    {
        private List<Peer> _peers = new List<Peer>();
        public TimeSpan Alive { get; } = TimeSpan.FromSeconds(10);
        public TimeSpan Suspended { get; } = TimeSpan.FromSeconds(20);
        public TimeSpan Dead { get; } = TimeSpan.FromSeconds(60);

        public Peer AddPeer(Peer peer)
        {
            _peers.Add(peer);
            return peer;
        }

        public Peer TouchPeer(Peer peer)
        {
            var old = _peers.FirstOrDefault(p => p.Host == peer.Host && p.GrpcPort == peer.GrpcPort && p.UiPort == peer.UiPort);
            if (old is not null)
            {
                var json = JsonConvert.SerializeObject(peer);
                JsonConvert.PopulateObject(json, old);
            }
            else
            {
                old = AddPeer(peer);
            }

            return old;
        }

        public IEnumerable<Peer> GetPeers()
        {
            return _peers;
        }

        public IEnumerable<Peer> GetActivePeers()
        {
            return GetPeers().Where(p => DateTime.UtcNow - p.Timestamp < Suspended);
        }
    }
}
