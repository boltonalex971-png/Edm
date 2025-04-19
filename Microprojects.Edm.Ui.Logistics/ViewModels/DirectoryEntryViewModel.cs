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
}