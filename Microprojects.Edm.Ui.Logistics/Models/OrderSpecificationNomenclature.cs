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
    public double Total => Items.Select(i => i.Quantity).Count();
    public ICollection<Item> Items { get; set; } = new List<Item>();    
}