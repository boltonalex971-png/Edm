using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Utils
{
    public static class ExceptionHelper
    {
        public static string GetFullInfo(this Exception e)
        {
            var message = new StringBuilder();
            message.Append($"{e.GetType().FullName}: {e.Message}\n{e.StackTrace}\n");
            if (e is AggregateException)
            {
                message.Append("\nInner exceptions:\n\n");
                foreach (var ex in ((AggregateException)e).InnerExceptions)
                {
                    message.Append(ex.GetFullInfo());
                }
            }
            else if (e.InnerException != null)
            {
                message.Append(e.InnerException.GetFullInfo());
            }
            message.Append("\n");
            return message.ToString();
        }

        public static string GetMeaningfulMessage(this Exception e)
        {
            return e.InnerException?.Message ?? e.Message;
        }
    }
}
