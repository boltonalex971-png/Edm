namespace Microprojects.Edm.Ui.Logistics.Models;

public interface IWithMeta : IDomainObject
{
    Meta Meta { get; set; }
}