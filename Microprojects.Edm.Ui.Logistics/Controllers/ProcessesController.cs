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
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class ProcessesController : AuthControllerBase
{
    private readonly ILogger<ProcessesController> _logger;
    private readonly IMapper _mapper;
    private readonly IProcessService _processService;
    private readonly IDirectoryService _directoryService;
    private readonly IPluginContainer _plugins;

    public ProcessesController(ILogger<ProcessesController> logger, IMapper mapper, 
        IProcessService processService, IDirectoryService directoryService,
        IPluginContainer plugins, IConfiguration configuration) :
        base(configuration)
    {
        _logger = logger;
        _mapper = mapper;
        _processService = processService;
        _directoryService = directoryService;
        _plugins = plugins;
    }

    [HttpGet]
    public async Task<IEnumerable<Process>> Get()
    {
        return await _processService.GetAll();
    }

    [HttpGet("hierarchy")]
    public async Task<IEnumerable<DirectoryEntryViewModel>> GetHierarchy()
    {
        var processes = _mapper.Map<IEnumerable<DirectoryEntryViewModel>>(
            await _processService.GetAll());
        var folders = _mapper.Map<IEnumerable<DirectoryEntryViewModel>>(
            await _directoryService.GetTree(nameof(Process), UserInfo.Groups));
        var tree = folders.Concat(processes)
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
    public async Task<ProcessViewModel> GetById(Guid id)
    {
        if (id != Guid.Empty)
        {
            var process = await _processService.Get(id);
            var model = _mapper.Map<ProcessViewModel>(process);
            return model;
        }
        else
        {
            return new ProcessViewModel
            {
                Name = string.Empty,
                Description = string.Empty,
            };
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<Process> Save(Guid id, [FromBody] ProcessViewModel model)
    {
        var process = _mapper.Map<Process>(model);
        if (id != process.Id)
        {
            throw new Exception("Process id is ambiguous");
        }

        process.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Process)
        };
        var result = await _processService.Save(process);
        return result;
    }

    [HttpDelete("{id:guid}")]
    public async Task<Process> DeleteProcess(Guid id)
    {
        var process = await _processService.Delete(id);
        return process;
    }

    [HttpPost]
    public async Task<Process> Create([FromBody] ProcessViewModel model)
    {
        var process = _mapper.Map<Process>(model);
        process.Meta = new Meta
        {
            Owner = UserInfo.Name,
            Metatype = nameof(Process),
            //Groups = model.Division == null ? [] : [model.Division]
        };
        var result = await _processService.Save(process);
        return result;
    }
    
    [HttpPut("{id:guid}/parent")]
    public async Task<ProcessViewModel> ChangeParent(Guid id, [FromBody] DirectoryViewModel parent)
    {
        var result = await _processService.ChangeParent<Process>(id, parent.Id);
        return _mapper.Map<ProcessViewModel>(result);
    }

    [HttpGet("kinds")]
    public IEnumerable<string> GetProcessKinds() => Enum.GetNames(typeof(ProcessKinds));

    #region subprocesses

    [HttpGet("{id:guid}/subprocesses")]
    public async Task<IEnumerable<SubProcessViewModel>> GetSubProcesses(Guid id)
    {
        if (id == Guid.Empty)
        {
            return new List<SubProcessViewModel>();
        }

        var subs = await _processService.GetSubProcesses(id);
        var model = _mapper.Map<IEnumerable<SubProcessViewModel>>(subs);
        return model;
    }

    [HttpPut("{id:guid}/subprocesses")]
    public async Task<SubProcessViewModel> SaveWorkbench(Guid id, SubProcessViewModel model)
    {
        var sp = _mapper.Map<SubProcess>(model);
        var result = await _processService.SaveSubProcess(sp);
        return _mapper.Map<SubProcessViewModel>(result);
    }

    [HttpPost("{id:guid}/subprocesses")]
    public async Task<SubProcessViewModel> AddProfile(Guid id, SubProcessViewModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var subProcess = _mapper.Map<SubProcess>(model);
        subProcess = await _processService.AddSubProcess(id, subProcess);
        return _mapper.Map<SubProcessViewModel>(subProcess);
    }

    [HttpDelete("{id:guid}/subprocesses/{subProcessId:guid}")]
    public async Task<bool> DeleteProfile(Guid id, Guid subProcessId)
    {
        var wasDetached = await _processService.DeleteSubProcess(id, subProcessId);
        return wasDetached;
    }

    #endregion
}