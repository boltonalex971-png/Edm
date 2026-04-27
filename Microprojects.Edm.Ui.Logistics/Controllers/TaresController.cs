using AutoMapper;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Optosense.Edm.Core.AspNet.Auth;
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
    private readonly ITareService _tareService;

    public TaresController(IMapper mapper, LogisticsContext db, ITareService tareService, IConfiguration configuration)
        : base(configuration)
    {
        _mapper = mapper;
        _db = db;
        _tareService = tareService;
    }

    [HttpGet("search")]
    [RequireRoles("Operator", "Technologist", "Admin")]
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
    /// together with the number of remaining available slots. When
    /// <paramref name="barcode"/> is supplied, results are additionally
    /// narrowed to tares whose barcode contains the given text
    /// (case-sensitive). When <paramref name="includeFull"/> is true,
    /// tares with no remaining capacity are also returned (useful for
    /// source-tare lookups in repacking, where a "full" tare is the
    /// expected starting point).
    /// </summary>
    [HttpGet("available")]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<IEnumerable<AvailableTareViewModel>> GetAvailable(
        [FromQuery] Guid? tareTypeId = null,
        [FromQuery] string? barcode = null,
        [FromQuery] bool includeFull = false,
        [FromQuery] Guid? nomenclatureId = null)
    {
        // Callers may issue this lookup before the user has chosen a tare
        // type or nomenclature (e.g. dropdowns mount before selection).
        // Treat the missing case as "no available tares" instead of returning 400.
        var hasType = tareTypeId != null && tareTypeId != Guid.Empty;
        var hasNomenclature = nomenclatureId != null && nomenclatureId != Guid.Empty;
        if (!hasType && !hasNomenclature && barcode == null)
        {
            return Array.Empty<AvailableTareViewModel>();
        }

        var query = _db.Tares.AsNoTracking()
            .Include(t => t.TareType)
            .Where(t => tareTypeId == null || t.TareTypeId == tareTypeId.Value);

        if (hasNomenclature && !hasType)
        {
            var allowedTypeIds = await _db.NomenclatureTareTypes.AsNoTracking()
                .Where(x => x.NomenclatureId == nomenclatureId!.Value)
                .Select(x => x.TareTypeId)
                .ToListAsync();
            query = query.Where(t => allowedTypeIds.Contains(t.TareTypeId));
        }

        if (!string.IsNullOrWhiteSpace(barcode))
        {
            var bc = barcode.Trim();
            query = query.Where(t => t.Barcode != null && t.Barcode.Contains(bc));
        }

        var tares = await query.ToListAsync();
        var tareIds = tares.Select(t => t.Id).ToList();
        var activeItems = await _db.Items.AsNoTracking()
            .Include(i => i.Meta)
            .Where(i => i.TareId != null && tareIds.Contains(i.TareId.Value) && i.Meta.Deleted == null && i.Meta.Completed == null)
            .ToListAsync();

        var result = new List<AvailableTareViewModel>();
        foreach (var tare in tares)
        {
            var itemsInTare = activeItems.Where(i => i.TareId == tare.Id).ToList();

            double used = tare.TareType.Dimensions > 0 && tare.TareType.Countable
                ? itemsInTare.Count
                : itemsInTare.Sum(i => i.Quantity);

            var remaining = tare.TareType.Capacity - used;
            if (remaining <= 0 && !includeFull)
            {
                continue;
            }

            result.Add(new AvailableTareViewModel
            {
                Id = tare.Id,
                Barcode = tare.Barcode,
                TareTypeId = tare.TareTypeId,
                TareTypeName = tare.TareType.Name,
                TareTypeUnits = tare.TareType.Units,
                SizeX = tare.TareType.SizeX,
                SizeY = tare.TareType.SizeY,
                SizeZ = tare.TareType.SizeZ,
                Dimensions = tare.TareType.Dimensions,
                Capacity = tare.TareType.Capacity,
                Remaining = remaining,
            });
        }

        return result;
    }

    [HttpPost]
    [RequireRoles("Operator", "Technologist", "Admin")]
    public async Task<TareViewModel> Create([FromBody] CreateTareRequest model)
    {
        var tareType = await _db.TareTypes.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == model.TareTypeId)
            ?? throw new EdmException("Tare type not found.");

        // Route through the service so the required Meta row is created (Tare
        // now implements IWithMeta and has an FK on Meta.Id).
        var tare = await _tareService.Save(new Tare
        {
            Id = Guid.Empty,
            Barcode = model.Barcode,
            TareTypeId = model.TareTypeId,
        });

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
