using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Utils
{
    public static class OptoConvert
    {
        public static string ToAsciiString(this byte[] bytes)
        {
            var buffer = new StringBuilder();
            //foreach (var @byte in bytes)
            //{
            //    if (@byte > sbyte.MaxValue)
            //    {
            //        buffer.AppendFormat("\\x{0:x2}", @byte);
            //    }
            //    else
            //    {
            //        buffer.Append(Convert.ToChar(@byte));
            //    }
            //}
            var ascii = Encoding.UTF7.GetChars(bytes);
            buffer.Append(ascii);
            return buffer.ToString();
        }

        public static byte[] ToBytes(this string chars)
        {
            if (chars == null)
            {
                return null;
            }
            return chars.ToCharArray().Select(c => (byte) c).ToArray();
        }

        public static string ToByteString(this string chars)
        {
            if (chars == null)
            {
                return null;
            }
            var buffer = new StringBuilder();
            foreach (var @char in chars)
            {
                if (@char > sbyte.MaxValue || @char < 32)
                {
                    buffer.AppendFormat(@"<\x{0:X2}>", (int)@char);
                }
                else
                {
                    buffer.Append(@char);
                }
            }
            return buffer.ToString();
        }

        public static string ToWholeByteString(this string chars)
        {
            if (chars == null)
            {
                return null;
            }
            var buffer = new StringBuilder();
            foreach (var @char in chars)
            {
                buffer.AppendFormat(@"\x{0:X2}", (int)@char);
            }
            return buffer.ToString();
        }

        public static string ToRawString(this byte[] bytes)
        {
            if (bytes == null)
            {
                return null;
            }
            var buffer = new StringBuilder();
            foreach (var @byte in bytes)
            {
                buffer.Append((char)((int)@byte));
            }
            return buffer.ToString();
        }
    }
}
