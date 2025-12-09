using System;
using System.Text.Json.Serialization;

//using Newtonsoft.Json;
//using Newtonsoft.Json.Converters;

//using System.Text.Json.Serialization;

namespace Optosense.Edm.Infrastructure.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
//[JsonConverter(typeof(StringEnumConverter))]
public enum OperationDataType
{
    Device,
    Audit,
    Lifecycle
}

public class OperationDataContainer
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
//    [JsonConverter(typeof(StringEnumConverter))]
    public OperationDataType Type { get; set; }
    public object Data { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}