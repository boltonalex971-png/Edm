using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Shared.Contracts;
using Microprojects.Edm.Shared.Persistence;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace Microprojects.Edm.Shared.Services;

// Generic CRUD base for any plugin's Guid-id services. Generic over TContext
// (any concrete SharedDbContext) so each plugin's services bind to their own
// DbContext while reusing the same Meta-aware Get/Save/Delete logic.
public class ServiceBase<TContext, TEntity> : IGenericService<TEntity>
    where TContext : SharedDbContext
    where TEntity : class, IDomainObject
{
    protected TContext Db { get; set; }
    protected IUserService UserService { get; set; }

    public ServiceBase() { }

    public ServiceBase(TContext db, IUserService userService)
    {
        Db = db;
        UserService = userService;
    }

    protected static string NameOrPlaceholder(string? name) =>
        string.IsNullOrEmpty(name) ? "?" : name;

    // Auto-fork helper for forkable services (TareType, Nomenclature, Process,
    // and any future versioned IWithMeta entity). Allocates a new Id on
    // proposed, attaches a fresh Meta whose OriginId points back at oldMeta,
    // marks the predecessor as Completed, and adds the new row to the DbSet.
    // Caller handles the trivial-field / reference checks, junction-row
    // re-pointing, and SaveChangesAsync.
    protected void ForkEntity(TEntity proposed, Meta oldMeta)
    {
        if (proposed is not IWithMeta proposedWithMeta)
        {
            throw new InvalidOperationException(
                $"{typeof(TEntity).Name} cannot be forked: not IWithMeta.");
        }

        var newId = DomainObject.NewGuid();
        proposed.Id = newId;

        var newMeta = new Meta
        {
            Id = newId,
            Owner = NameOrPlaceholder(UserService.GetUserName()),
            Metatype = oldMeta.Metatype,
            Groups = oldMeta.Groups,
            OriginId = oldMeta.Id,
        };
        proposedWithMeta.Meta = newMeta;

        Set().Add(proposed);
        oldMeta.Completed = DateTime.UtcNow;
    }

    protected DbSet<TEntity> Set() => Db.Set<TEntity>();

    protected DbSet<T> Set<T>() where T : class, IDomainObject => Db.Set<T>();

    public async Task<TEntry> ChangeParent<TEntry>(Guid id, Guid newParentId) where TEntry : DirectoryEntry
    {
        var entry = await Set<TEntry>().FindAsync(id);
        if (entry == null)
        {
            throw new EdmException(
                "Edm.Entry.NotFound",
                new Dictionary<string, object> { ["type"] = typeof(TEntry).Name, ["id"] = id },
                $"Directory entry {typeof(TEntry).Name} with Id {id} not found.");
        }

        var folder = await Set<Directory>().FindAsync(newParentId);
        if (folder == null)
        {
            throw new EdmException(
                "Edm.Directory.NotFound",
                new Dictionary<string, object> { ["id"] = newParentId },
                $"Directory with Id {newParentId} not found.");
        }

        entry.DirectoryId = folder.Id;
        await Db.SaveChangesAsync();
        return entry;
    }

    public virtual async Task<IEnumerable<TEntity>> GetAll(Expression<Func<TEntity, bool>>? predicate = null)
    {
        var query = Set().AsNoTracking();

        if (typeof(TEntity).IsAssignableTo(typeof(IWithMeta)))
        {
            query = query
                .Include(e => ((IWithMeta)e).Meta)
                .Where(e => ((IWithMeta)e).Meta.Deleted == null && ((IWithMeta)e).Meta.Completed == null);

            // Group filter: empty Groups means public; otherwise the user must
            // share at least one group. Admins bypass.
            if (UserService is not null && !UserService.IsAdmin())
            {
                var userGroups = UserService.GetUserGroups();
                if (userGroups is { Length: > 0 })
                {
                    query = query.Where(e => ((IWithMeta)e).Meta.Groups.Length == 0 ||
                                             ((IWithMeta)e).Meta.Groups.Any(g => userGroups.Contains(g)));
                }
            }
        }

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return await query.ToListAsync();
    }

    public virtual async Task<TEntity> Get(Guid id)
    {
        return await Set().FirstOrDefaultAsync(p => id == p.Id);
    }

    public virtual async Task<TEntity> Get<TInclude>(Guid id, Expression<Func<TEntity, TInclude>> include)
    {
        return await Set().Include(include).FirstOrDefaultAsync(p => id == p.Id);
    }

    public virtual async Task<TEntity> Get<TInclude, TInclude2>(Guid id,
        Expression<Func<TEntity, TInclude>> include, Expression<Func<TEntity, TInclude2>> include2)
    {
        return await Set()
            .Include(include)
            .Include(include2)
            .FirstOrDefaultAsync(p => id == p.Id);
    }

    public async Task<IEnumerable<TEntity>> Get<T1>(Expression<Func<TEntity, bool>> predicate,
        Expression<Func<TEntity, T1>> include)
    {
        return await Set().Include(include).Where(predicate).ToListAsync();
    }

    protected virtual async Task<T> Get<T>(Guid id) where T : class, IDomainObject
    {
        return await Set<T>().FirstOrDefaultAsync(p => id == p.Id);
    }

    public virtual async Task<IEnumerable<TEntity>> Get(Expression<Func<TEntity, bool>> predicate)
    {
        return await Set().Where(predicate).ToListAsync();
    }

    // Default forwarder for the auto-fork-aware Save overload. Services that
    // don't version inherit this no-op default and ignore force. Forkable
    // services override this overload directly.
    public virtual Task<TEntity> Save(TEntity entity, bool force) => Save(entity);

    public virtual async Task<TEntity> Save(TEntity entity)
    {
        var state = entity.Id == Guid.Empty ? EntityState.Added : EntityState.Modified;
        var id = DomainObject.NewGuid();
        if (entity is IWithMeta withMeta)
        {
            if (state == EntityState.Added)
            {
                entity.Id = id;
                withMeta.Meta = new Meta
                {
                    Id = id,
                    Owner = NameOrPlaceholder(UserService?.GetUserName()),
                    Metatype = typeof(TEntity).Name,
                };
                Set().Add(entity);
            }
            else
            {
                withMeta.Meta = null!;
                var meta = await Set<Meta>().FindAsync(entity.Id) ??
                           throw new EdmException(
                               "Edm.Meta.NotFound",
                               "Cannot find the corresponding meta information.");
                meta.Modified = DateTime.UtcNow;
                Set<History>().Add(new History
                {
                    Id = DomainObject.NewGuid(),
                    MetaId = meta.Id,
                    Author = NameOrPlaceholder(UserService?.GetUserName()),
                    JsonValue = JsonConvert.SerializeObject(withMeta)
                });
                Set().Attach(entity).State = EntityState.Modified;
            }
        }
        else
        {
            if (state == EntityState.Added)
            {
                entity.Id = id;
            }
            Set().Attach(entity).State = state;
        }

        await Db.SaveChangesAsync();
        return entity;
    }

    protected virtual async Task<T> Save<T>(T entity) where T : class, IDomainObject
    {
        var state = entity.Id == Guid.Empty ? EntityState.Added : EntityState.Modified;
        if (entity is IWithMeta withMeta && state == EntityState.Added)
        {
            entity.Id = DomainObject.NewGuid();
            withMeta.Meta = new Meta
            {
                Id = entity.Id,
                Owner = NameOrPlaceholder(UserService?.GetUserName()),
                Metatype = typeof(T).Name,
            };
            Set<T>().Add(entity);
        }
        else
        {
            if (state == EntityState.Added)
            {
                entity.Id = DomainObject.NewGuid();
            }
            Set<T>().Attach(entity).State = state;
        }
        await Db.SaveChangesAsync();
        return entity;
    }

    protected virtual async Task<TEntity> Delete(TEntity entity, bool physical = false)
    {
        switch (entity)
        {
            case null:
                throw new EdmException(
                    "Edm.Meta.EntityNull",
                    null,
                    "Entity cannot be null.",
                    new ArgumentNullException(typeof(TEntity).Name));
            case IWithMeta:
            {
                var info = await Set<Meta>().FindAsync(entity.Id)
                           ?? throw new EdmException(
                               "Edm.Meta.NotFound",
                               null,
                               "Cannot find the corresponding meta information.",
                               new ArgumentNullException(typeof(TEntity).Name));
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

    protected virtual async Task<T> Delete<T>(Guid id) where T : class, IDomainObject
    {
        var entity = await Get<T>(id);
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
