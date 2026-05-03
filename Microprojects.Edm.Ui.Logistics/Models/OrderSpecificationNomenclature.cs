using System.ComponentModel.DataAnnotations.Schema;

namespace Microprojects.Edm.Ui.Logistics.Models;

[NotMapped]
public class OrderSpecificationNomenclature
{
    public Guid NomenclatureId => Nomenclature.Id;
    public Nomenclature Nomenclature { get; set; }
    public Guid OrderId => Order.Id;
    public Order Order { get; set; }
    public double Quantity { get; set; }
    public double Amount => Quantity * Order.Amount;
    /// <summary>
    /// Quantity allocated to this spec — sum of <see cref="Item.Quantity"/>
    /// for live items plus the historical consumption recovered from
    /// <c>ItemLink.ConsumedQuantity</c> for items already drained by Execute.
    /// Set explicitly by <c>OrderService.GetSpecifications</c> so completed
    /// inputs still report their original allocation post-execution.
    /// </summary>
    public double Total { get; set; }
    public ICollection<Item> Items { get; set; } = new List<Item>();
}