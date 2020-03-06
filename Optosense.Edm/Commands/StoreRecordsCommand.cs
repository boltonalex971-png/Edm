using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Commands;
using Microprojects.Edm.Log;
using Optosense.Edm.DataAccess;
using Optosense.Edm.Domain.Models;
using Microprojects.Edm.Utils;
using System;
using System.Threading.Tasks;

namespace Optosense.Edm.Commands
{
    // TODO This functionality can be a part of StartStage command to avoid using resources when no stages started
    [Command(Name = "StoreRecords", Lifetime = CommandType.Permanent, Parameters = typeof(StoreRecordsCommandParameters))]
    public class StoreRecordsCommand : BaseCommand
    {
        // TODO MEF can be used if a command instance is creating via deep cloning
        //[Import(RequiredCreationPolicy = CreationPolicy.Shared)]
        protected ICache Cache { get; set; } = CacheHelper.GetInstance();

        [CommandParameter]
        public string ConnectionString { get; set; } = "Data Source=.\\SQLEXPRESS;MultipleActiveResultSets=true;Initial Catalog=optosense_edm;Integrated Security=SSPI;";

        public override async Task<object> ExecuteAsync()
        {
            while (true)
            {
                if (CancellationToken.IsCancellationRequested)
                {
                    CancellationToken.ThrowIfCancellationRequested();
                }

                using (var context = new EdmContext(ConnectionString))
                {
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
                        // Commented as not actual when the context is disposing every time
                        //// to avoid memory leaks (let the measure object be garbage collected)
                        //context.ChangeTracker.Entries().ToList().ForEach(e => e.State = EntityState.Detached);
                    }
                    catch (Exception e)
                    {
                        // Swallow the exception not to breaking up storing process
                        Logger.Log($"Some InstructionExecutions lost: {e.GetFullInfo()}");
                    }
                }

                await Task.Delay(TimeSpan.FromSeconds(1));
            }
            //return "Ok"; // Unreachable code
        }
    }
    public class StoreRecordsCommandParameters : ICommandParameters
    {
        public string CacheConnectionString { get; set; }
        public string DbConnectionString { get; set; }
    }

}


