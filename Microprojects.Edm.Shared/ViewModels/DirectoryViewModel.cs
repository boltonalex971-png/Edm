namespace Microprojects.Edm.Shared.ViewModels;

// Editor-form payload for a single folder. Inherits Groups (from
// DirectoryEntryViewModel) which is the security/access primitive.
// IsPublic is a derived UI flag — true iff Groups is empty — surfaced
// so the form can render a simple toggle instead of an empty array.
public class DirectoryViewModel : DirectoryEntryViewModel
{
    public bool IsPublic { get; set; }
}
