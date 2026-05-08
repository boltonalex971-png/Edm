using Microsoft.AspNetCore.Mvc;
using Microprojects.Edm.Controllers;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public abstract class CrudControllerBase<TObject, TObjectViewModel, TService> : AuthControllerBase
    where TObject : DomainObject
    where TService : IGenericService<TObject>
    where TObjectViewModel : new()
{
    protected readonly TService Service;

    protected CrudControllerBase(TService service, IConfiguration configuration) :
        base(configuration)
    {
        Service = service;
    }

    protected abstract TObjectViewModel ToViewModel(TObject entry);
    protected abstract TObject ToEntity(TObjectViewModel model);

    [HttpGet]
    public async Task<IEnumerable<TObjectViewModel>> GetAll()
    {
        var result = await Service.GetAll();
        return result.Select(ToViewModel).ToList();
    }

    [HttpGet("{id:guid}")]
    public virtual async Task<TObjectViewModel> GetObjectById(Guid id)
    {
        if (id != Guid.Empty)
        {
            var entry = await Service.Get(id);
            return ToViewModel(entry);
        }

        return new TObjectViewModel();
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TObjectViewModel>> SaveObject(
        Guid id,
        [FromBody] TObjectViewModel model,
        [FromQuery] bool force = false)
    {
        var entry = ToEntity(model);
        if (id != entry.Id)
        {
            throw new Exception($"{typeof(TObject).Name} id is ambiguous");
        }

        try
        {
            var result = await Service.Save(entry, force);
            return ToViewModel(result);
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
        return ToViewModel(result);
    }

    [HttpPost]
    public async Task<TObjectViewModel> CreateObject([FromBody] TObjectViewModel model)
    {
        var entry = ToEntity(model);
        var result = await Service.Save(entry);
        return ToViewModel(result);
    }
}
