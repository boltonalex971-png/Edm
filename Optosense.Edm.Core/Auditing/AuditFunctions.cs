using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Optosense.Edm.Domain.Models;

namespace Optosense.Edm.Core.Auditing
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
            var doubles = values.Select(v => double.TryParse(v.ToString(), out var number) ? number : 0).ToList();
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

        [AuditFunc(Name = "Failure", Format = "Failures<{0}")]
        [AuditArg("Max amount", typeof(double))]
        public static AuditResult FailureFunction(AuditCriterion criterion, IEnumerable<Record> measures)
        {
            var result = new AuditResult();
            return result;
        }

        [AuditFunc(Name = "Tolerance", Format = "{0}±{1}%")]
        [AuditArg("Value, integer", typeof(int))]
        [AuditArg("Tolerance, in %", typeof(double))]
        public static AuditResult AccuracyFunction(AuditCriterion criterion, IEnumerable<Record> measures)
        {
            var result = new AuditResult();
            return result;
        }

        [AuditFunc(Name = "Deviation", Format = "σ<{0}%")]
        [AuditArg("Max deviation, in %", typeof(double))]
        public static AuditResult DeviationFunction(AuditCriterion criterion, IEnumerable<Record> measures)
        {
            var result = new AuditResult();
            return result;
        }

        [AuditFunc(Name = "Noise", Format = "Noise<{0}%")]
        [AuditArg("Max noise, in %", typeof(double))]
        public static AuditResult NoiseFunction(AuditCriterion criterion, IEnumerable<Record> measures)
        {
            var result = new AuditResult { Valid = true, Message = string.Empty };
            return result;
        }

        [AuditFunc(Name = "Drift", Format = "Drift<{0}%")]
        [AuditArg("Max drift, in %", typeof(double))]
        public static AuditResult DriftFunction(AuditCriterion criterion, IEnumerable<Record > measures)
        {
            var result = new AuditResult();
            return result;
        }
    }

    #endregion
}