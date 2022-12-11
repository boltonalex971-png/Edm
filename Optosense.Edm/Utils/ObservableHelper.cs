using Microprojects.Edm.Drivers;
using Microprojects.Edm.Utils;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reactive.Concurrency;
using System.Reactive.Linq;
using System.Reactive.Threading.Tasks;
using System.Threading;
using System.Threading.Tasks;

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

        public static IObservable<T> Pace<T>(
            this IObservable<T> source, 
            IDeviceDriver driver,
            Func<T, Task<bool>> delay,
            Func<IDeviceDriver, T, Task> action)
        {
            return source.Select(i => Observable.Create<T>(async (obs, token) =>
            {
                var ok = await delay(i);
                await action(driver, i);
                obs.OnNext(i);
            })).Concat(); 
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

        public static Task Launch(this IEnumerable<DriverRequest> plan,
            IDeviceDriver driver, Action<IDeviceDriver, DriverRequest> action,
            ILogger logger,
            CancellationToken? cancellationToken = null)
        {
            var token = cancellationToken ?? CancellationToken.None;
            var startedAt = DateTime.Now;
            var task = plan.ToObservable()
                .Pace(p => TimeSpan.FromMilliseconds(p.Offset))
                .ObserveOn(NewThreadScheduler.Default)
                .Do(
                    onNext: p => action(driver, p),
                    onError: e =>
                    {
                        logger.LogError($"Plan for driver {driver.GetType().Name} was cancelled with exception: {e.GetFullInfo()}");
                    },
                    onCompleted: () =>
                    {
                        logger.LogInformation($"Plan for driver {driver.GetType().Name} completed successfully");
                    }
                ).ToTask(token, driver as object);
            task.ContinueWith(t =>
            {
                switch (t.Status)
                {
                    case TaskStatus.Canceled:
                        logger.LogInformation($"Driver {t.Id} {t.AsyncState.GetType().Name} was cancelled by user");
                        break;
                    case TaskStatus.Faulted:
                        logger.LogError($"Driver {t.Id} {t.AsyncState.GetType().Name} was cancelled with exception: {t.Exception.Flatten().GetFullInfo()}");
                        break;
                    case TaskStatus.RanToCompletion:
                        logger.LogInformation($"Driver {t.Id} {t.AsyncState.GetType().Name} completed successfully");
                        break;
                }
            });
            return task;
        }

        public static Task Launch(this IEnumerable<DriverRequest> plan,
            IDeviceDriver driver, 
            Func<DriverRequest, Task<bool>> condition, 
            Func<IDeviceDriver, DriverRequest, Task> action,
            ILogger logger,
            CancellationToken? cancellationToken = null)
        {
            var token = cancellationToken ?? CancellationToken.None;
            var startedAt = DateTime.Now;
            var task = plan.ToObservable()
                .Pace(driver, condition, action)
                .ObserveOn(NewThreadScheduler.Default)
                .Do(
                    onNext: p =>
                    {
                        //await action(driver, p);
                    },
                    onError: e =>
                    {
                        logger.LogError($"Plan for driver {driver.GetType().Name} was cancelled with exception: {e.GetFullInfo()}");
                    },
                    onCompleted: () =>
                    {
                        logger.LogInformation($"Plan for driver {driver.GetType().Name} completed successfully");
                    }
                ).ToTask(token, driver as object);
            task.ContinueWith(t =>
            {
                switch (t.Status)
                {
                    case TaskStatus.Canceled:
                        logger.LogInformation($"Driver {t.Id} {t.AsyncState.GetType().Name} was cancelled by user");
                        break;
                    case TaskStatus.Faulted:
                        logger.LogError($"Driver {t.Id} {t.AsyncState.GetType().Name} was cancelled with exception: {t.Exception.Flatten().GetFullInfo()}");
                        break;
                    case TaskStatus.RanToCompletion:
                        logger.LogInformation($"Driver {t.Id} {t.AsyncState.GetType().Name} completed successfully");
                        break;
                }
            });
            return task;
        }
    }
}
