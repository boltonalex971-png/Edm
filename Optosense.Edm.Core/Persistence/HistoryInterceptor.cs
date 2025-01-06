using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Optosense.Edm.Persistence
{
    /// <summary>
    /// Has to be registered on db context registration
    /// </summary>
    public class HistoryInterceptor : SaveChangesInterceptor
    {
        public override async ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
        {
            Console.WriteLine(JsonSerializer.Serialize(eventData));
            
            return await base.SavedChangesAsync(eventData, result, cancellationToken);
        }
    }
}
