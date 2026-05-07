using System;
using System.Collections.Concurrent;
using System.Reactive.Disposables;
using System.Threading.Tasks;
using Microprojects.Edm.Intercom;
using Newtonsoft.Json;
using Optosense.Edm.Intercom.Events;

namespace Microprojects.Edm.Ui.Technologies.Intercom;
public static class OptosenseIntercomExtensions
{
    private static readonly Func<object, string> OperationDataChannel = (id) => 
        $"{IntercomExtensions.IntercomOperationChannel(id)}-data";
    private static readonly Func<object, string> AuditChannel = (id) => 
        $"{IntercomExtensions.IntercomOperationChannel(id)}-audit";
    private static readonly Func<object, string> OperatorChannel = (id) => 
        $"{IntercomExtensions.IntercomOperationChannel(id)}-operator";
    
    extension(IIntercom intercom)
    {
        public async Task PublishOperationDataAsync<TData>(object id, TData args) where TData : OperationDataEvent =>
            await intercom.Publish(OperationDataChannel(id), args);
        
        // public async Task PublishAuditDataAsync(object id, AuditDataEvent args) =>
        //     await intercom.PublishOperationDataAsync(OperationDataChannel(id), args);
        //
        // public async Task PublishRecordDataAsync(object id, RecordDataEvent args) =>
        //     await intercom.PublishOperationDataAsync(OperationDataChannel(id), args);
        
        public async Task PublishRecordAsync(object id, RecordEvent args) =>
            await intercom.Publish(AuditChannel(id), args);

        public async Task PublishOperatorAsync(object id, object args) =>
            await intercom.Publish(OperatorChannel(id), args);
    }

    extension((object id, IIntercom intercom) op)
    {
        public IDisposable HandleRecord(IntercomExtensions.IntercomEvent<RecordEvent> action) => 
            op.intercom.Handle(AuditChannel(op.id), action); 
    }
}