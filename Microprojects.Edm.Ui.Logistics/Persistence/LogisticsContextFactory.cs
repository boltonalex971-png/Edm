using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Microprojects.Edm.Ui.Logistics.Persistence;
    
public class LogisticsContextFactory : IDesignTimeDbContextFactory<LogisticsContext>
{
    public LogisticsContext CreateDbContext(string[] args)
    {
        foreach (var arg in args)
        {
            Console.WriteLine(arg);
        }
        
        var connectionString = args[1];
        var optionsBuilder = new DbContextOptionsBuilder<LogisticsContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new LogisticsContext(optionsBuilder.Options);
    }
}
