using UUIDNext;

namespace Microprojects.Edm.Ui.Logistics.Models;

public class DomainObject : IDomainObject
{
    public static Guid NewGuid() => Uuid.NewDatabaseFriendly(Database.SqlServer); 
    public virtual Guid Id { get; set; }
}

public static class DomainObjectHelper
{
    public static T SetId<T>(this T obj) where T : DomainObject
    {
        obj.Id = DomainObject.NewGuid();
        return obj;
    }
}
