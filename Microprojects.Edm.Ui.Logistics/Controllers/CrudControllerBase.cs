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
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Plugins;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class CrudControllerBase<TObject, TObjectViewModel, TService> : AuthControllerBase 
    where TObject : DomainObject
    where TService : IGenericService<TObject>
    where TObjectViewModel : new()
{
    protected readonly IMapper Mapper;
    protected readonly TService Service;

    public CrudControllerBase(IMapper mapper, TService service, IConfiguration configuration) :
        base(configuration)
    {
        Mapper = mapper;
        Service = service;
    }

    [HttpGet]
    public async Task<IEnumerable<TObjectViewModel>> GetAll()
    {
        var result = await Service.GetAll(); 
        return Mapper.Map<IEnumerable<TObjectViewModel>>(result);
    }

    [HttpGet("{id:guid}")]
    public virtual async Task<TObjectViewModel> GetObjectById(Guid id)
    {
        if (id != Guid.Empty)
        {
            var entry = await Service.Get(id);
            var model = Mapper.Map<TObjectViewModel>(entry);
            return model;
        }

        return new TObjectViewModel();
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TObjectViewModel>> SaveObject(
        Guid id,
        [FromBody] TObjectViewModel model,
        [FromQuery] bool force = false)
    {
        var entry = Mapper.Map<TObject>(model);
        if (id != entry.Id)
        {
            throw new Exception($"{typeof(TObject).Name} id is ambiguous");
        }

        try
        {
            var result = await Service.Save(entry, force);
            return Mapper.Map<TObjectViewModel>(result);
        }
        catch (Services.ForkRequiredException ex)
        {
            return Conflict(new { detail = ex.Message, code = "fork-required" });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<TObjectViewModel> DeleteObject(Guid id)
    {
        var result = await Service.Delete(id);
        return Mapper.Map<TObjectViewModel>(result);
    }

    [HttpPost]
    public async Task<TObjectViewModel> CreateObject([FromBody] TObjectViewModel model)
    {
        var entry = Mapper.Map<TObject>(model);
        var result = await Service.Save(entry);
        return Mapper.Map<TObjectViewModel>(result);
    }
}