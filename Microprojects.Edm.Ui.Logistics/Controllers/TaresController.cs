using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Optosense.Edm.Core.AspNet.Controllers;

namespace Microprojects.Edm.Ui.Logistics.Controllers;

[ApiController]
[Route("api/logistics/[controller]")]
public class TaresController : AuthControllerBase
{
    private readonly IMapper _mapper;
    private readonly LogisticsContext _db;

    public TaresController(IMapper mapper, LogisticsContext db, IConfiguration configuration)
        : base(configuration)
    {
        _mapper = mapper;
        _db = db;
    }

    [HttpGet("search")]
    public async Task<IEnumerable<TareViewModel>> Search([FromQuery] string? barcode)
    {
        var query = _db.Tares.AsNoTracking()
            .Include(t => t.TareType)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(barcode))
        {
            var bc = barcode.Trim();
            query = query.Where(t => t.Barcode != null && t.Barcode.Contains(bc));
        }

        var result = await query.Take(50).ToListAsync();
        return result.Select(t => new TareViewModel
        {
            Id = t.Id,
            Barcode = t.Barcode,
            TareTypeId = t.TareTypeId,
            TareTypeName = t.TareType?.Name,
            TareTypeUnits = t.TareType?.Units,
            SizeX = t.TareType?.SizeX,
            SizeY = t.TareType?.SizeY,
            SizeZ = t.TareType?.SizeZ,
            Dimensions = t.TareType?.Dimensions ?? 0,
            Capacity = t.TareType?.Capacity ?? 0,
        });
    }

    /// <summary>
    /// Returns tares of the given type that still have free slots/capacity,
    /// together with the number of remaining available slots.
    /// </summary>
    [HttpGet("available")]
    public async Task<IEnumerable<AvailableTareViewModel>> GetAvailable([FromQuery] Guid tareTypeId)
    {
        var tareType = await _db.TareTypes.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tareTypeId)
            ?? throw new EdmException("Tare type not found.");

        var tares = await _db.Tares.AsNoTracking()
            .Where(t => t.TareTypeId == tareTypeId)
            .ToListAsync();

        var tareIds = tares.Select(t => t.Id).ToList();

        var activeItems = await _db.Items.AsNoTracking()
            .Include(i => i.Meta)
            .Where(i => i.TareId != null && tareIds.Contains(i.TareId.Value) && i.Meta.Deleted == null)
            .ToListAsync();

        var result = new List<AvailableTareViewModel>();
        foreach (var tare in tares)
        {
            var itemsInTare = activeItems.Where(i => i.TareId == tare.Id).ToList();

            double used = tareType.Dimensions > 0 && tareType.Countable
                ? itemsInTare.Count
                : itemsInTare.Sum(i => i.Quantity);

            var remaining = tareType.Capacity - used;
            if (remaining <= 0)
            {
                continue;
            }

            result.Add(new AvailableTareViewModel
            {
                Id = tare.Id,
                Barcode = tare.Barcode,
                TareTypeId = tare.TareTypeId,
                TareTypeName = tareType.Name,
                TareTypeUnits = tareType.Units,
                SizeX = tareType.SizeX,
                SizeY = tareType.SizeY,
                SizeZ = tareType.SizeZ,
                Dimensions = tareType.Dimensions,
                Capacity = tareType.Capacity,
                Remaining = remaining,
            });
        }

        return result;
    }

    [HttpPost]
    public async Task<TareViewModel> Create([FromBody] CreateTareRequest model)
    {
        var tareType = await _db.TareTypes.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == model.TareTypeId)
            ?? throw new EdmException("Tare type not found.");

        var tare = new Tare
        {
            Id = Guid.Empty,
            Barcode = model.Barcode,
            TareTypeId = model.TareTypeId,
        };

        _db.Tares.Add(tare);
        tare.Id = DomainObject.NewGuid();
        await _db.SaveChangesAsync();

        return new TareViewModel
        {
            Id = tare.Id,
            Barcode = tare.Barcode,
            TareTypeId = tare.TareTypeId,
            TareTypeName = tareType.Name,
            TareTypeUnits = tareType.Units,
            SizeX = tareType.SizeX,
            SizeY = tareType.SizeY,
            SizeZ = tareType.SizeZ,
            Dimensions = tareType.Dimensions,
            Capacity = tareType.Capacity,
        };
    }
}
