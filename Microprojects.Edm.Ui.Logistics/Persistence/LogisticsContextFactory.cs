using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Microprojects.Edm.Ui.Logistics.Persistence;
    
public class LogisticsContextFactory : IDesignTimeDbContextFactory<LogisticsContext>
{
    public LogisticsContext CreateDbContext(string[] args)
    {
        // Two callers with different argument conventions:
        //   dev-time  : `dotnet ef ... -- --connection-string VALUE` → args = ["--connection-string", VALUE]
        //   bundle run: `bundle.exe --connection VALUE` → args is empty; the bundle
        //               calls Database.SetConnectionString(VALUE) on the returned
        //               context, so the placeholder we give UseSqlServer here is
        //               discarded. We just need UseSqlServer to accept something.
        var connectionString = args.Length >= 2
            ? args[1]
            : "Server=placeholder;Database=placeholder;";
        var optionsBuilder = new DbContextOptionsBuilder<LogisticsContext>();
        optionsBuilder.UseSqlServer(connectionString);
        return new LogisticsContext(optionsBuilder.Options);
    }
}
