using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Commands;
using Microprojects.Edm.Log;
using Optosense.Edm.DataAccess;
using Optosense.Edm.Domain.Models;
using Microprojects.Edm.Utils;
using System;
using System.Threading.Tasks;
using Optosense.Edm.Core.Persistance;

namespace Optosense.Edm.Commands
{
    // TODO This functionality can be a part of StartOperation command to avoid using resources when no stages started
    [Command(Name = "StoreRecords", Lifetime = CommandType.LongRunning)]
    public class StoreRecordsCommand : BaseCommand
    {
        protected ICache Cache { get; init; }
        protected IEdmContextFactory ContextFactory { get; init; }

        public StoreRecordsCommand() { }
        public StoreRecordsCommand(ICache cache, IEdmContextFactory factory)
        {
            Cache = cache;
            ContextFactory = factory;
        }

        public override async Task<object> ExecuteAsync()
        {
            while (true)
            {
                if (CancellationToken.IsCancellationRequested)
                {
                    CancellationToken.ThrowIfCancellationRequested();
                }

                using var context = ContextFactory.Create();
                try
                {
                    var rec = Cache.Pop<Record>();
                    if (rec != null)
                    {

                        // TODO The entry must be deleted from cache after saving data properly 
                        //      or processing an exception reliably 
                        for (; rec != null; rec = Cache.Pop<Record>())
                        {
                            context.Records.Add(rec);
                        }
                    }
                }
                catch (Exception e)
                {
                    Logger.Error($"Command {Name} got an exception: {e.GetFullInfo()}");
                    // TODO exeptionHandler just terminates the command, but must reliably process an exception
                    //exceptionHandler(this, e);
                }

                try
                {
                    await context.SaveChangesAsync();
                    foreach (var rec in context.ChangeTracker.Entries<Record>())
                    {
                        await Cache.Publish("test", rec.Entity);
                    }
                }
                catch (Exception e)
                {
                    //TODO Check what was saved in the context (and publish it)
                    //     and store the records that weren't
                    // Swallow the exception not to breaking up storing process
                    Logger.Log($"Some InstructionExecutions lost: {e.GetFullInfo()}");
                }

                await Task.Delay(TimeSpan.FromSeconds(1));
            }
            //return "Ok"; // Unreachable code
        }
    }
}


