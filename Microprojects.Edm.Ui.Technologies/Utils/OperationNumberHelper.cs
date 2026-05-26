using System.Globalization;
using System.Text.RegularExpressions;

namespace Microprojects.Edm.Ui.Technologies.Utils;

public static class OperationNumberHelper
{
    public static string GenerateNext(string? latest)
    {
        if (string.IsNullOrEmpty(latest))
        {
            return "1";
        }

        var match = Regex.Match(latest, @"\d+", RegexOptions.RightToLeft);
        if (!match.Success)
        {
            return latest + "1";
        }

        var incremented = long.Parse(match.Value, CultureInfo.InvariantCulture) + 1;
        var replacement = incremented
            .ToString(CultureInfo.InvariantCulture)
            .PadLeft(match.Length, '0');
        return latest[..match.Index] + replacement + latest[(match.Index + match.Length)..];
    }
}
