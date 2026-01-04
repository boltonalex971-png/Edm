using System;
using System.Text.Json.Serialization;

namespace Optosense.Edm.Infrastructure.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OperationDataType
{
    Device,
    Audit,
    Lifecycle
}

public class OperationDataContainer
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public OperationDataType Type { get; set; }
    public object Data { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}