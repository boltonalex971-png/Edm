using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microprojects.Edm.Domain;

namespace Microprojects.Edm.Shared.Contracts;

// Guid-id CRUD contract shared across plugin services. Plugin-specific
// service interfaces (IDirectoryService, INomenclatureService,
// IHostService, …) extend this and add methods.
public interface IGenericService<T>
{
    Task<IEnumerable<T>> GetAll(Expression<Func<T, bool>>? predicate = null);
    Task<T> Get(Guid id);
    Task<T> Get<T1>(Guid id, Expression<Func<T, T1>> include);
    Task<T> Get<T1, T2>(Guid id, Expression<Func<T, T1>> include, Expression<Func<T, T2>> include2);
    Task<IEnumerable<T>> Get(Expression<Func<T, bool>> predicate);
    Task<IEnumerable<T>> Get<T1>(Expression<Func<T, bool>> predicate, Expression<Func<T, T1>> include);
    Task<T> Save(T entry);

    // Save with an explicit confirmation flag for entities that participate
    // in auto-fork versioning. force=true means the caller has accepted that
    // the change will create a new version (the old row gets Meta.Completed
    // set and a fresh row is inserted with Meta.OriginId pointing back at
    // it). Services that don't fork ignore the flag.
    Task<T> Save(T entry, bool force);

    Task<T> Delete(Guid id);

    Task<TEntry> ChangeParent<TEntry>(Guid entryId, Guid newParentId) where TEntry : DirectoryEntry;
}
