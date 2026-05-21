using System;

namespace Microprojects.Edm.Shared.ViewModels;

// Plain Id-carrier payload used by endpoints that take a single
// entity reference (e.g. ChangeParent). Lives in Shared so any plugin
// controller can [FromBody] it.
public class DomainObjectViewModel
{
    public Guid Id { get; set; }
}
