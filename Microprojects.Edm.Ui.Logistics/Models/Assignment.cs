namespace Microprojects.Edm.Ui.Logistics.Models;

/// <summary>
/// Represents the order to produce some quantity of certain nomenclature. It includes an appropriate
/// technology process and a list of required parts and materials available for production.   
/// </summary>
public class Assignment : DomainObject
{
    public Guid NomenclatureId { get; set; }
    
    /// <summary>
    /// Must be used not earlier than 'From'
    /// </summary>
    public DateTime From { get; set; }
    /// <summary>
    /// Must be used not later than 'To'
    /// </summary>
    public DateTime To { get; set; }
    
    public Nomenclature Nomenclature { get; set; }
}