using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Optosense.Edm.Core.AspNet.Controllers;
using Optosense.Edm.Plugins;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class EntriesControllerBase<TEntry, TEntryViewModel, TService> : AuthControllerBase 
    where TService : IGenericService<TEntry> 
    where TEntry : DirectoryEntry
    where TEntryViewModel : DirectoryEntryViewModel, new()
{
    protected readonly IMapper Mapper;
    protected readonly TService Service;
    protected readonly IDirectoryService DirectoryService;

    public EntriesControllerBase(IMapper mapper, TService service, IDirectoryService directoryService, IConfiguration configuration) :
        base(configuration)
    {
        Mapper = mapper;
        Service = service;
        DirectoryService = directoryService;
    }

    [HttpGet]
    public async Task<IEnumerable<TEntryViewModel>> GetAllEntries()
    {
        var entries = await Service.GetAll();
        return Mapper.Map<IEnumerable<TEntryViewModel>>(entries);
    }

    [HttpGet("hierarchy")]
    public async Task<IEnumerable<DirectoryEntryViewModel>> GetEntryHierarchy()
    {
        var entries = Mapper.Map<IEnumerable<DirectoryEntryViewModel>>(
            await Service.GetAll());
        var folders = Mapper.Map<IEnumerable<DirectoryEntryViewModel>>(
            await DirectoryService.GetTree(typeof(TEntry).Name, UserInfo.Groups));
        var tree = folders.Concat(entries)
            .ToList()
            .ToTree();

        return tree;
    }

    [HttpGet("{id:guid}")]
    public async Task<TEntryViewModel> GetEntryById(Guid id)
    {
        if (id != Guid.Empty)
        {
            var entry = await Service.Get(id);
            var model = Mapper.Map<TEntryViewModel>(entry);
            return model;
        }

        return new TEntryViewModel
        {
            Name = string.Empty,
            Description = string.Empty,
        };
    }

    [HttpPut("{id:guid}")]
    public async Task<TEntry> SaveEntry(Guid id, [FromBody] TEntryViewModel model)
    {
        var entry = Mapper.Map<TEntry>(model);
        if (id != entry.Id)
        {
            throw new Exception($"{typeof(TEntry).Name} id is ambiguous");
        }

        var result = await Service.Save(entry);
        return result;
    }

    [HttpDelete("{id:guid}")]
    public async Task<TEntry> DeleteEntry(Guid id)
    {
        var entry = await Service.Delete(id);
        return entry;
    }

    [HttpPost]
    public async Task<TEntry> CreateEntry([FromBody] TEntryViewModel model)
    {
        var entry = Mapper.Map<TEntry>(model);
        var result = await Service.Save(entry);
        return result;
    }

    [HttpPut("{id:guid}/parent")]
    public async Task<TEntryViewModel> ChangeEntryParent(Guid id, [FromBody] DirectoryViewModel parent)
    {
        var result = await Service.ChangeParent<TEntry>(id, parent.Id);
        return Mapper.Map<TEntryViewModel>(result);
    }
}