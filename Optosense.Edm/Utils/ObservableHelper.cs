using System;
using System.Collections.Generic;
using System.Linq;
using System.Reactive.Concurrency;
using System.Reactive.Linq;
using System.Reactive.Threading.Tasks;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microprojects.Edm.Log;
using Microprojects.Edm.Utils;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Drivers;

namespace Optosense.Edm.Utils
{
    public static class ObservableHelper
    {

        public static IObservable<T> Pace<T>(this IObservable<T> source, TimeSpan interval)
        {
            return source.Select(i => Observable.Return(i).Delay(interval)).Concat();
        }

        public static IObservable<T> Pace<T>(this IObservable<T> source, Func<T, TimeSpan> selector)
        {
            return source.Select(i => Observable.Return(i).Delay(selector(i))).Concat();
        }

        public static IObservable<T> Pace<T>(this IObservable<T> source, Func<T, DateTime> selector)
        {
            return source.Select(i => Observable.Return<T>(i).Delay(selector(i))).Concat(); //.Merge()
        }

        public static IObservable<T> Execute<T>(this IObservable<T> instructions, IObserver<T> observer)
        {
            return Observable.Create<T>(o =>
            {
                return instructions.Subscribe(observer);
            });
        }

        public static IDisposable Start(this IEnumerable<Record> plan,
            Action<Record> action, Action completedAction = null, Action<Exception> errorAction = null)
        {
            return plan.ToObservable()
                .Pace(ie => ie.ScheduledAt)
                .Timeout(TimeSpan.FromMinutes(60))
                .ObserveOn(NewThreadScheduler.Default)
                .Subscribe(
                    onNext: action, 
                    onCompleted: completedAction ?? (() => { }), 
                    onError: errorAction ?? ((e) => { }));
        }

        public static Task Launch(this IEnumerable<ProfilePoint> plan,
            IDeviceDriver driver,
            Action<IDeviceDriver, string> action, 
            CancellationToken? cancellationToken = null)
        {
            var token = cancellationToken ?? CancellationToken.None;
            var startedAt = DateTime.Now;
            var task = plan.ToObservable()
                .Pace(p => TimeSpan.FromMilliseconds(p.Offset))
                .ObserveOn(NewThreadScheduler.Default)
                .Do(
                    onNext: p => action(driver, p.Operation),
                    onError: e => 
                    {
                        Logger.Error($"Plan for driver {driver.GetType().Name} was cancelled with exception: {e.GetFullInfo()}");
                    },
                    onCompleted: () => 
                    {
                        Logger.Log($"Plan for driver {driver.GetType().Name} completed successfully");
                    }
                ).ToTask(token, driver as object);
            task.ContinueWith(t => 
            {
                switch (t.Status)
                {
                    case TaskStatus.Canceled:
                        Logger.Log($"Driver {t.Id} {t.AsyncState.GetType().Name} was cancelled by user");
                        break;
                    case TaskStatus.Faulted:
                        Logger.Error($"Driver {t.Id} {t.AsyncState.GetType().Name} was cancelled with exception: {t.Exception.Flatten().GetFullInfo()}");
                        break;
                    case TaskStatus.RanToCompletion:
                        Logger.Log($"Driver {t.Id} {t.AsyncState.GetType().Name} completed successfully");
                        break;
                }
            });
            return task;
        }

    }
}
