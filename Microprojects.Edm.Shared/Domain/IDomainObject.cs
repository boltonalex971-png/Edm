using System;

namespace Microprojects.Edm.Domain;

public interface IDomainObject
{
    Guid Id { get; set; }
}
