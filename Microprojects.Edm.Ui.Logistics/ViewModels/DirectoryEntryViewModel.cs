namespace Microprojects.Edm.Ui.Logistics.ViewModels;

public class DirectoryEntryViewModel
{
    public bool HasChildren => Items is not null && Items.Length > 0;

    public Guid Id { get; set; }
    public Guid? DirectoryId { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public bool IsFolder { get; set; } = false;
    public DirectoryEntryViewModel[]? Items { get; set; }
    public bool Expanded { get; set; }

    /// <summary>
    /// Access groups copied from <c>Meta.Groups</c> for folders. Surfaces in the
    /// tree so the UI can mark restricted folders with a group-acronym chip.
    /// Null/empty means public.
    /// </summary>
    public string[]? Groups { get; set; }

    /// <summary>
    /// True when the entity has been superseded by an auto-fork (Meta.Completed
    /// is set). UI surfaces this as a read-only "outdated" indicator.
    /// </summary>
    public bool Outdated { get; set; }
}