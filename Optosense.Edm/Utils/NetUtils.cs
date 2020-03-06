using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Utils
{
    public static class NetUtils
    {
        public static IEnumerable<string> GetLocalHostNames()
        {
            var host = Dns.GetHostEntry(Dns.GetHostName());
            var ips = host.AddressList.Where(a => a.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork).Select(a => a.ToString());
            return ips;
        }
    }
}
