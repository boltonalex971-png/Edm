using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Reactive.Linq;
using System.Reactive.Threading.Tasks;
using System.Threading.Tasks;

namespace Optosense.Edm.Utils
{
    public static class SerialPortExtensions
    {
        public static IObservable<byte> EchoMode(this SerialPort port, byte command, int timeout)
        {
            var _observablePort = Observable.FromEventPattern<SerialDataReceivedEventArgs>(port, "DataReceived");
            return Observable.Create<byte>(observer =>
            {
                var subscription = _observablePort.Timeout(TimeSpan.FromMilliseconds(timeout)).Subscribe(
                    onNext: _ =>
                    {
                        try
                        {
                            var readBuffer = new byte[port.BytesToRead];
                            var readCount = port.Read(readBuffer, 0, readBuffer.Length);
                            if (readCount == 1)
                            {
                                observer.OnNext(readBuffer[0]);
                            }
                            else
                            {
                                observer.OnError(new EdmException($"Wrong echo length: {readCount}"));
                            }
                            observer.OnCompleted();
                        }
                        catch (Exception e)
                        {
                            observer.OnError(e);
                        }
                    },
                    onError: e =>
                    {
                        observer.OnError(e);
                        observer.OnCompleted();
                    }
                );

                port.Write(new byte[] { command }, 0, 1);
                return subscription;
            });
        }

        public static async Task<char[]> Send(this SerialPort port, string command, int responseLength, bool singleLine, int timeout)
        {
            var result = new List<char>();
            var buffer = new byte[128];
            var totalRead = 0;
            port.BaseStream.ReadTimeout = timeout;
            port.ReadTimeout = timeout;
            await port.BaseStream.WriteAsync(command.ToBytes(), 0, command.Length);
            try
            {
                do
                {
                    var bytesRead = port.BaseStream.Read(buffer, 0, buffer.Length);
                    totalRead += bytesRead;
                    result.AddRange(buffer.Take(bytesRead).Select(b => (char)b));
                } while (!((singleLine && result.LastOrDefault() == '\r' || !singleLine && result.LastOrDefault() == '\0' && result.Count > 0) && (responseLength == 0 || responseLength <= result.Count)));
            }
            catch (TimeoutException e)
            {
                if (singleLine || result.Count() == 0)
                {
                    var ex = new SerialPortException(e)
                    {
                        Buffer = buffer.Count() > 0 ? (new string(result.ToArray())).ToByteString() : null,
                        Port = port.PortName,
                        Command = command,
                        Timeout = timeout,
                        ResponseLength = responseLength,
                        SingleLine = singleLine
                    };
                    throw;
                }
            }

            return result.ToArray();
        }

        public static IObservable<char[]> ToLine(this SerialPort port, string command, int responseLength, bool singleLine, int timeout)
        {
            var _observablePort = Observable.FromEventPattern<SerialDataReceivedEventArgs>(port, "DataReceived");
            return Observable.Create<char[]>(observer =>
            {
                var buffer = new List<char>();

                port.Write(command);

                var subscription = _observablePort.Timeout(TimeSpan.FromMilliseconds(timeout)).Subscribe(
                    onNext: _ =>
                    {
                        try
                        {
                            var readBuffer = new byte[port.BytesToRead];
                            var readCount = port.Read(readBuffer, 0, readBuffer.Length);
                            // Multiplexor gives redundant leading zeros occasionally, so get rid of them
                            buffer.AddRange(readBuffer./*SkipWhile(b => b == 0).*/Select(b => (char)b));

                            if (new string(buffer.ToArray()) == "FAL\r")
                            {
                                observer.OnError(new Exception($"Wrong syntax {new string(buffer.ToArray())}"));
                                observer.OnCompleted();
                            }
                            if ((/*!singleLine && buffer.LastOrDefault() == '\0' ||*/ singleLine && buffer.LastOrDefault() == '\r') && (responseLength == 0 || responseLength <= buffer.Count))
                            {
                                observer.OnNext(buffer.ToArray());
                                observer.OnCompleted();
                            }
                        }
                        catch (Exception e)
                        {
                            observer.OnError(e);
                        }
                    },
                    onError: e =>
                    {
                        if (e is TimeoutException && !singleLine && buffer.Count() > 0)
                        {
                            observer.OnNext(buffer.ToArray());
                        }
                        else
                        {
                            //Logger.Log($"Timeout for '{command}' on port {port.PortName}. Buffer='{new string(buffer.ToArray())}'");
                            observer.OnError(new SerialPortException(e)
                            {
                                Buffer = buffer.Count() > 0 ? (new string(buffer.ToArray())).ToByteString() : null,
                                Port = port.PortName,
                                Command = command,
                                Timeout = timeout,
                                ResponseLength = responseLength,
                                SingleLine = singleLine
                            });
                        }
                        observer.OnCompleted();
                    }
                );

                return subscription;
            });
        }

        public static char[] Request(this SerialPort port, string command, int? address = null, int responseLength = 0, bool singleLine = true, int timeout = 1500, int retries = 0)
        {
            var fullCommand = $"{(address == null ? string.Empty : $"#{address:X2}")}{command}\r";
            char[] result;
            //var obs = port.ToLine(fullCommand, responseLength, singleLine, timeout);
            while (true)
            {
                try
                {
                    //result = obs.ToTask().Result;
                    result = port.Send(fullCommand, responseLength, singleLine, timeout).Result;
                    break;
                }
                catch (AggregateException e)
                {
                    if (e.InnerException is TimeoutException && retries-- > 0)
                    {
                        continue;
                    }

                    throw;
                }
            }

            return result;
        }
    }
}
