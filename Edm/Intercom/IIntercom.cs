using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Intercom
{
    public interface IIntercom
    {
        IDisposable Subscribe<T>(string channel, Action<T> onNext, Action<Exception> onError = null, Action onCompleted = null);
        IDisposable Subscribe(string channel, Action<object> onNext);
        Task<long> Publish<T>(string channel, T message);
    }
}
