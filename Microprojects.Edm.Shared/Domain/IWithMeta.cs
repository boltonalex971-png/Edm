namespace Microprojects.Edm.Domain;

public interface IWithMeta : IDomainObject
{
    Meta Meta { get; set; }
}
