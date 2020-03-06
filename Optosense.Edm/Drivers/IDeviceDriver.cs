using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Drivers
{
    public interface IDeviceDriver : IDisposable
    {
        DriverOptions Options { get; set; }
        /// <summary>
        /// Init gas camera
        /// </summary>
        string Init();

        /// <summary>
        /// Start generation gas mix
        /// </summary>
        string Start();

        /// <summary>
        /// Stop generating gas mix
        /// </summary>
        string Stop();

        /// <summary>
        /// Set gas mix concentration
        /// </summary>
        /// <param name="concentration">Required concentration</param>
        string Set(object param);

        /// <summary>
        /// Get current gas mix concentration
        /// </summary>
        /// <returns>Current concentration</returns>
        string Get();

        string Ping();

        string Execute(string command);
    }

    public interface IProfilable
    {
        IEnumerable<(double Value, TimeSpan Offset)> Profile { get; set; }
    }

    public class DriverOptions
    {
    }


}
