using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Optosense.Edm.Core.Infrastructure.Mapper;
using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Auditing
{
    public class AuditFunctions
    {
        public delegate AuditResult AuditFunction(AuditCriterion criterion, IEnumerable<object> values);

        public static AuditFunction Function(string name)
        {
            var method = typeof(AuditFunctions).GetMethods().Single(mi => mi
                .GetCustomAttributes(typeof(AuditFuncAttribute))
                .Any(a => ((AuditFuncAttribute) a).Name == name));
            return (AuditFunction) Delegate.CreateDelegate(typeof(AuditFunction), method, true);
        }

        public static string GetFunctionFormat(string funcName)
        {
            var method = typeof(AuditFunctions).GetMethods().Single(mi => mi
                .GetCustomAttributes(typeof(AuditFuncAttribute))
                .Any(a => ((AuditFuncAttribute) a).Name == funcName));
            return method?.GetCustomAttribute<AuditFuncAttribute>()?.Format ?? string.Empty;
        }

        public static IEnumerable<AuditFuncMetadata> GetAnalysisFunctions()
        {
            var functions = typeof(AuditFunctions).GetMethods()
                .Where(m => m.GetCustomAttributes<AuditFuncAttribute>().Any())
                .Select(m => new AuditFuncMetadata(m))
                .ToList();
            return functions;
        }

        #region Functions

        [AuditFunc(Name = "Range", Format = "[{0}..{1}]")]
        [AuditArg("Min value", typeof(double))]
        [AuditArg("Max value", typeof(double))]
        public static AuditResult IntervalFunction(AuditCriterion criterion, IEnumerable<object> values)
        {
            var doubles = values
                .Where(v => v != null && v.ToString() != "null")
                .Select(v => double.TryParse(v.ToString(), CultureInfo.InvariantCulture, out var number) ? number : 0).ToList();
            if (!doubles.Any() && values.Any())
            {
                return new AuditResult
                {
                    Result = "Not a value",
                    Valid = false,
                    Message = "Value is not available"
                };
            }

            double.TryParse(criterion.Arg1, out var min);
            double.TryParse(criterion.Arg2, out var max);
            var minValue = doubles.Min();
            var maxValue = doubles.Max();
            var result = new AuditResult 
            {
                Result = string.Format("[{0}..{1}]", minValue, maxValue),
                Valid = minValue >= min && maxValue <= max
            };
            result.Message = !result.Valid ? $"{criterion.Param} is out of bound" : default;
            return result;
        }

        [AuditFunc(Name = "Equals", Format = "='{0}'")]
        [AuditArg("To", typeof(string))]
        public static AuditResult EqualsFunction(AuditCriterion criterion, IEnumerable<object> values)
        {
            var result = new AuditResult
            {
                Valid = values.All(v => v?.ToString() == criterion.Arg1),
                Result = string.Format("='{0}'", criterion.Arg1)
            };
            if (!result.Valid)
            {
                var fail = values.FirstOrDefault(v => v?.ToString() != criterion.Arg1);
                result.Result = string.Format("'{0}'≠'{1}'", fail, criterion.Arg1);
                result.Message = $"{criterion.Param}'s value '{fail}' not equal to '{criterion.Arg1}'";
            }

            return result;
        }

        [AuditFunc(Name = "Not Equal", Format = "!='{0}'")]
        [AuditArg("To", typeof(string))]
        public static AuditResult NotEqualFunction(AuditCriterion criterion, IEnumerable<object> values)
        {
            var result = new AuditResult
            {
                Valid = values.All(v => v?.ToString() != criterion.Arg1),
                Result = string.Format("='{0}'", criterion.Arg1)
            };
            if (!result.Valid)
            {
                var fail = values.FirstOrDefault(v => v?.ToString() == criterion.Arg1);
                result.Result = string.Format("'{0}'=='{1}'", fail, criterion.Arg1);
                result.Message = $"{criterion.Param}'s value '{fail}' equals to '{criterion.Arg1}'";
            }

            return result;
        }

        [AuditFunc(Name = "Failure", Format = "Failures<{0}")]
        [AuditArg("Max amount", typeof(double))]
        public static AuditResult FailureFunction(AuditCriterion criterion, IEnumerable<object> values)
        {
            if (!double.TryParse(criterion.Arg1, out var max)) {
                throw new ArgumentException("Failure criterion must by double");
            }

            var failures = values.Count(v => v == null);
            var valid = failures < max;
            var result = new AuditResult
            {
                Result = string.Format("{0}<{1}", failures, max),
                Valid = valid,
                Message = valid ? string.Empty : $"Too many failures reading {criterion.Param}"
            };

            return result;
        }

        [AuditFunc(Name = "Tolerance", Format = "{0}±{1}%")]
        [AuditArg("Value, integer", typeof(int))]
        [AuditArg("Tolerance, in %", typeof(double))]
        public static AuditResult AccuracyFunction(AuditCriterion criterion, IEnumerable<object> values)
        {
            var result = new AuditResult
            {
                Result = "{0}±{1}%",
                Valid = true,
                Message = "Not implemented"
            };
            return result;
        }

        [AuditFunc(Name = "Deviation", Format = "σ<{0}%")]
        [AuditArg("Max deviation, in %", typeof(double))]
        public static AuditResult DeviationFunction(AuditCriterion criterion, IEnumerable<object> values)
        {
            var result = new AuditResult
            {
                Result = "σ<{0}%",
                Valid = true,
                Message = "Not implemented"
            };
            return result;
        }

        [AuditFunc(Name = "Noise", Format = "Noise<{0}%")]
        [AuditArg("Max noise, in %", typeof(double))]
        public static AuditResult NoiseFunction(AuditCriterion criterion, IEnumerable<object> values)
        {
            var result = new AuditResult
            {
                Result = "Noise<{0}%",
                Valid = true,
                Message = "Not implemented"
            };
            return result;
        }

        [AuditFunc(Name = "Drift", Format = "Drift<{0}%")]
        [AuditArg("Max drift, in %", typeof(double))]
        public static AuditResult DriftFunction(AuditCriterion criterion, IEnumerable<object> values)
        {
            var result = new AuditResult
            {
                Result = "Drift<{0}%",
                Valid = true,
                Message = "Not implemented"
            };
            return result;
        }
    }

    #endregion
}