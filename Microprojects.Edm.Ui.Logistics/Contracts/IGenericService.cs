using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Models;

namespace Microprojects.Edm.Ui.Logistics.Contracts;

public interface IGenericService<T>
{
    Task<IEnumerable<T>> GetAll(Expression<Func<T, bool>>? predicate = null);
    Task<T> Get(Guid id);
    Task<T> Get<T1>(Guid id, Expression<Func<T, T1>> include);
    Task<T> Get<T1, T2>(Guid id, Expression<Func<T, T1>> include, Expression<Func<T, T2>> include2);
    Task<IEnumerable<T>> Get(Expression<Func<T, bool>> predicate);
    Task<IEnumerable<T>> Get<T1>(Expression<Func<T, bool>> predicate, Expression<Func<T, T1>> include);
    Task<T> Save(T entry);
    /// <summary>
    /// Save with an explicit confirmation flag for entities that participate in
    /// auto-fork versioning. <paramref name="force"/> indicates the caller has
    /// confirmed they accept that the change will create a new version (the old
    /// row will be marked outdated and a fresh row will be inserted with
    /// <see cref="Models.Meta.OriginId"/> pointing back at it). Services that
    /// don't fork ignore the flag.
    /// </summary>
    Task<T> Save(T entry, bool force);
    Task<T> Delete(Guid id);
    Task<T> ChangeParent<T>(Guid entryId, Guid newParentId) where T : DirectoryEntry;
}