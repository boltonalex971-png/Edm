namespace Microprojects.Edm.Ui.Logistics.Models;

/// Single source of truth for the per-entry-type root folders. Both runtime
/// services and the seed migration reference these constants — never duplicate
/// the literals.
public static class WellKnownDirectoryIds
{
    public static readonly Guid Root = Guid.Empty;

    public static readonly Guid Nomenclatures  = new("7f1791e2-0028-89ac-9cce-019dd417d015");
    public static readonly Guid Manufacturing  = new("803b11f2-cb55-8145-8d8d-019dd417d01a");
    public static readonly Guid Technology     = new("701f3747-9162-86e3-8d8e-019dd417d01a");
    public static readonly Guid Operations     = new("6bd8cdcf-a47f-8a55-8d8f-019dd417d01a");
    public static readonly Guid Specifications = new("ea259495-613d-808c-8d93-019dd417d01a");
    public static readonly Guid TareTypes      = new("d75940b0-f8f7-8fca-8d95-019dd417d01a");

    private static readonly HashSet<Guid> AllRoots =
    [
        Nomenclatures,
        Manufacturing,
        Technology,
        Operations,
        Specifications,
        TareTypes,
    ];

    public static bool IsTypeRoot(Guid id) => AllRoots.Contains(id);

    public static Guid? ResolveRoot(Type entryType, ProcessKinds? kind = null)
    {
        if (entryType == typeof(Nomenclature))  return Nomenclatures;
        if (entryType == typeof(Specification)) return Specifications;
        if (entryType == typeof(TareType))      return TareTypes;
        if (entryType == typeof(Process))
        {
            return kind switch
            {
                ProcessKinds.Manufacturing => Manufacturing,
                ProcessKinds.Technology    => Technology,
                ProcessKinds.Operation     => Operations,
                _                          => null,
            };
        }
        return null;
    }

    public static Guid? ResolveRoot(string entryType, string? kind = null)
    {
        ProcessKinds? parsedKind = null;
        if (!string.IsNullOrEmpty(kind) && Enum.TryParse<ProcessKinds>(kind, true, out var k))
        {
            parsedKind = k;
        }
        return entryType switch
        {
            nameof(Nomenclature)  => Nomenclatures,
            nameof(Specification) => Specifications,
            nameof(TareType)      => TareTypes,
            nameof(Process)       => parsedKind switch
            {
                ProcessKinds.Manufacturing => Manufacturing,
                ProcessKinds.Technology    => Technology,
                ProcessKinds.Operation     => Operations,
                _                          => null,
            },
            _ => null,
        };
    }
}
