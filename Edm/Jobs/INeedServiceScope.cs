using Microsoft.Extensions.DependencyInjection;

namespace Microprojects.Edm.Jobs;

public interface INeedServiceScope
{
    IServiceScope ServiceScope { get; set; }
}