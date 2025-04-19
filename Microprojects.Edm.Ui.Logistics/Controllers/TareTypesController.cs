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
public class TareTypesController : AuthControllerBase
{
    private readonly ILogger<TareTypesController> _logger;
    private readonly IMapper _mapper;
    private readonly ITareTypeService _service;
    private readonly IDirectoryService _directoryService;

    public TareTypesController(ILogger<TareTypesController> logger, IMapper mapper,
        ITareTypeService service, IDirectoryService directoryService, IConfiguration configuration) :
        base(configuration)
    {
        _logger = logger;
        _mapper = mapper;
        _service = service;
        _directoryService = directoryService;
    }

    [HttpGet]
    public async Task<IEnumerable<TareType>> Get()
    {
        return await _service.GetAll();
    }

    [HttpGet("hierarchy")]
    public async Task<IEnumerable<DirectoryEntryViewModel>> GetHierarchy()
    {
        var entries = _mapper.Map<IEnumerable<DirectoryEntryViewModel>>(
            await _service.GetAll());
        var folders = _mapper.Map<IEnumerable<DirectoryEntryViewModel>>(
            await _directoryService.GetTree(nameof(TareType), UserInfo.Groups));
        var tree = folders.Concat(entries)
            .ToList()
            .ToTree();
        // always expand root if just one
        // if (tree.Count() == 1)
        // {
        //     tree.First().expanded = true;
        // }

        return tree;
    }

    [HttpGet("{id:guid}")]
    public async Task<TareTypeViewModel> GetById(Guid id)
    {
        if (id != Guid.Empty)
        {
            var nomenclature = await _service.Get(id);
            var model = _mapper.Map<TareTypeViewModel>(nomenclature);
            return model;
        }

        return new TareTypeViewModel
        {
            Name = string.Empty,
            Description = string.Empty,
        };
    }

    [HttpPut("{id:guid}")]
    public async Task<TareType> Save(Guid id, [FromBody] TareTypeViewModel model)
    {
        var nomenclature = _mapper.Map<TareType>(model);
        if (id != nomenclature.Id)
        {
            throw new Exception("Process id is ambiguous");
        }

        nomenclature.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Process)
        };
        var result = await _service.Save(nomenclature);
        return result;
    }

    [HttpDelete("{id:guid}")]
    public async Task<TareType> Delete(Guid id)
    {
        var nomenclature = await _service.Delete(id);
        return nomenclature;
    }

    [HttpPost]
    public async Task<TareType> Create([FromBody] TareTypeViewModel model)
    {
        var nomenclature = _mapper.Map<TareType>(model);
        nomenclature.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Process),
            //Groups = model.Division == null ? [] : [model.Division]
        };
        var result = await _service.Save(nomenclature);
        return result;
    }

    [HttpPut("{id:guid}/parent")]
    public async Task<TareTypeViewModel> ChangeParent(Guid id, [FromBody] DirectoryViewModel parent)
    {
        var result = await _service.ChangeParent<TareType>(id, parent.Id);
        return _mapper.Map<TareTypeViewModel>(result);
    }
}