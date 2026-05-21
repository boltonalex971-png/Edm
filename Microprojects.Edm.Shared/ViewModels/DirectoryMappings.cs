using System.Linq;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Shared.ViewModels;

public static class DirectoryMappings
{
    public static DirectoryEntryViewModel ToEntryViewModel(this Directory s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            IsFolder = true,
            Expanded = true,
            Groups = s.Meta?.Groups,
            Items = s.Children?.Select(c => c.ToEntryViewModel()).ToArray(),
        };

    public static DirectoryViewModel ToViewModel(this Directory s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            IsFolder = true,
            Items = s.Children?.Select(c => c.ToEntryViewModel()).ToArray(),
            Groups = s.Meta?.Groups,
            IsPublic = s.Meta == null || s.Meta.Groups.Length == 0,
        };

    public static Directory ToEntity(this DirectoryViewModel s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            Meta = null!,
        };

    public static DirectoryEntryViewModel ToEntryViewModel(this DirectoryEntry s) =>
        new()
        {
            Id = s.Id,
            DirectoryId = s.DirectoryId,
            Name = s.Name,
            Description = s.Description,
            IsFolder = s is Directory,
            Expanded = true,
        };
}
