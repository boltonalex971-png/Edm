using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;
using Newtonsoft.Json;
using Directory = Microprojects.Edm.Ui.Logistics.Models.Directory;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class ServiceBase<TEntity> : IGenericService<TEntity> where TEntity : DomainObject
{
    #region Injected Properties
    protected LogisticsContext Db { get; set; }
    //protected ICache Cache { get; set; }
    //protected ILogger Log { get; set; }
    #endregion

    public ServiceBase() { }

    public ServiceBase(LogisticsContext db)
    {
        Db = db;
    }

    protected DbSet<TEntity> Set()
    {
        var set = Db.Set<TEntity>();
        return set;
    }

    protected DbSet<T> Set<T>() where T : DomainObject
    {
        var set = Db.Set<T>();
        return set;
    }

    public async Task<TEntry> ChangeParent<TEntry>(Guid id, Guid newParentId) where TEntry : DirectoryEntry 
    {
        var entry = await Set<TEntry>().FindAsync(id);
        if (entry == null)
        {
            throw new EdmException($"Directory entry {typeof(TEntry).Name} with Id {id} not found.");
        }

        var folder = await Set<Directory>().FindAsync(newParentId);
        if (folder == null)
        {
            throw new EdmException($"Directory with Id {newParentId} not found.");
        }

        entry.DirectoryId = folder.Id;
        await Db.SaveChangesAsync();
        return entry;
    }

    public virtual async Task<IEnumerable<TEntity>> GetAll()
    {
        var query = Set().AsNoTracking();
        var result = await (Set() is IWithMeta ? 
                query
                    .Include(e => ((IWithMeta)e).Meta)
                    .Where(e => ((IWithMeta)e).Meta.Deleted == null) : 
                query)
            .ToListAsync();
        
        return result;
    }

    public virtual async Task<TEntity> Get(Guid id)
    {
        var result = await Set()
            .FirstOrDefaultAsync(p => id == p.Id);
        return result;
    }

    public virtual async Task<TEntity> Get<TInclude>(Guid id, Expression<Func<TEntity, TInclude>> include)
    {
        var result = await Set().Include(include)
            .FirstOrDefaultAsync(p => id == p.Id);
        return result;
    }

    public virtual async Task<TEntity> Get<TInclude, TInclude2>(Guid id, Expression<Func<TEntity, TInclude>> include, Expression<Func<TEntity, TInclude2>> include2)
    {
        var result = await Set()
            .Include(include)
            .Include(include2)
            .FirstOrDefaultAsync(p => id == p.Id);
        return result;
    }


    public async Task<IEnumerable<TEntity>> Get<T1>(Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, T1>> include)
    {
        var request = Set().Include(include);
        var whereReq = request.Where(predicate);
        var result = await whereReq.ToListAsync();
        return result;
    }

    protected virtual async Task<T> Get<T>(Guid id) where T : DomainObject
    {
        var result = await Set<T>()
            .FirstOrDefaultAsync(p => id == p.Id);
        return result;
    }

    public virtual async Task<IEnumerable<TEntity>> Get(Expression<Func<TEntity, bool>> predicate)
    {
        var result = await Set().Where(predicate).ToListAsync();
        return result;
    }

    public virtual async Task<TEntity> Save(TEntity entity)
    {
        var state = entity.Id == Guid.Empty ? EntityState.Added : EntityState.Modified;
        var id = DomainObject.NewGuid();
        if (entity is DirectoryEntry entry)
        {
            if (state == EntityState.Added)
            {
                // Db.Meta.Add(new Meta
                // {
                //     Id = id,
                //     Metatype = typeof(TEntity).Name,
                //     Owner = "Admin",
                //     Groups = [],
                //     Created = DateTime.UtcNow
                // });
                entry.Id = id;
                Set().Add(entity);
            }
            else
            {
                var info = entry.Meta;
                entry.Meta = null!;
                var meta = await Set<Meta>().FindAsync(entity.Id) ?? 
                           throw new EdmException("Cannot find the corresponding meta information.");
                meta.Modified = DateTime.UtcNow;
                Set<History>().Add(new History
                {
                    MetaId = meta.Id,
                    Author = info.Owner, 
                    JsonValue  = JsonConvert.SerializeObject(entry)
                });
                Set().Attach(entity).State = EntityState.Modified;
            }
        }

        await Db.SaveChangesAsync();
        return entity;
    }

    protected virtual async Task<T> Save<T>(T entity) where T : DomainObject
    {
        var track = Set<T>().Attach(entity);
        track.State = entity.Id == Guid.Empty ? EntityState.Added : EntityState.Modified;
        if (entity is DirectoryEntry && track.State == EntityState.Added)
        {
            // (entity as DirectoryObject).IsActive = true;
        }

        await Db.SaveChangesAsync();
        return entity;
    }

    protected virtual async Task<TEntity> Delete(TEntity entity, bool physical = false)
    {
        switch (entity)
        {
            case null:
                throw new EdmException("Entity cannot be null.", new ArgumentNullException(typeof(TEntity).Name));
            case DirectoryEntry:
            {
                var info = await Set<Meta>().FindAsync(entity.Id)
                           ?? throw new EdmException("Cannot find the corresponding meta information.", new ArgumentNullException(typeof(TEntity).Name));
                info.Deleted = DateTime.UtcNow;
                break;
            }
            default:
                Set().Remove(entity);
                break;
        }

        await Db.SaveChangesAsync();
        return entity;
    }

    public virtual async Task<TEntity> Delete(Guid id)
    {
        var entity = await Get(id);
        return await Delete(entity, false);
    }

    protected virtual async Task<T> Delete<T>(Guid id) where T : DomainObject
    {
        var entity = await Get<T>(id);
        // TODO Make soft delete as well
        var result = Set<T>().Remove(entity);
        await Db.SaveChangesAsync();
        return entity;
    }

    protected virtual async Task<TEntity> Delete(Guid id, Func<TEntity, bool> isLogical)
    {
        var entity = await Get(id);
        return await Delete(entity, isLogical(entity));
    }
}