using Microprojects.Edm.Ui.Logistics.Utils;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace Edm.Test;

[TestClass]
public class OrderNumberHelperTests
{
    [TestMethod]
    [DataRow(null, "1")]
    [DataRow("", "1")]
    [DataRow("1", "2")]
    [DataRow("9", "10")]
    [DataRow("099", "100")]
    [DataRow("00009", "00010")]
    [DataRow("foo", "foo1")]
    [DataRow("abc123def", "abc124def")]
    [DataRow("INV-2025-0007", "INV-2025-0008")]
    [DataRow("ORD-9", "ORD-10")]
    [DataRow("ORD-005", "ORD-006")]
    [DataRow("ORD-099", "ORD-100")]
    public void GenerateNext_ReturnsExpected(string latest, string expected)
    {
        Assert.AreEqual(expected, OrderNumberHelper.GenerateNext(latest));
    }
}
