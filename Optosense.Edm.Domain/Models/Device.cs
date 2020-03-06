using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Domain.Models
{
    public enum DeviceType
    {
        None = 0,
        Gas = 0x000F,
        Temperature = 0x00F0,
        Humidity = 0x0F00,
        Testing = 0xF000
    }

    public enum DeviceModel
    {
        None = 0,
        // Gas generators
        NullGas = 0x0001, // 1
        BKM = 0x0002, // 2
        GGS = 0x0003, // 3
        // Climate cameras
        NullTerm = 0x0010,  // 101
        Binder240 = 0x0020, // 102
        Binder720 = 0x030, // 103
        Jeio = 0x0040, // 104
        // Testing boards
        Board = 0x1000
    }

    public class Device : TypeObject
    {
        public DeviceModel Type { get; set; }
        public string Parameters { get; set; }

        [NotMapped]
        public DeviceType EnvType =>
            ((int) Type & (int) DeviceType.Gas) > 0 ? DeviceType.Gas :
            ((int) Type & (int) DeviceType.Temperature) > 0 ? DeviceType.Temperature :
            ((int) Type & (int) DeviceType.Humidity) > 0 ? DeviceType.Humidity :
            ((int) Type & (int) DeviceType.Testing) > 0 ? DeviceType.Testing :
            DeviceType.None;

        public ICollection<HostDevice> Hosts { get; set; }
    }
}
