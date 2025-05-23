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

/// <summary>
/// Provides a base implementation for generic service operations to manage entities in the database.
/// </summary>
/// <typeparam name="TEntity">The type of the entity being managed. Must inherit from <see cref="DomainObject"/>.</typeparam>
public class ServiceBase<TEntity> : IGenericService<TEntity> where TEntity : class, IDomainObject
{
    #region Injected Properties

    /// Represents the database context used by the service.
    /// The context is required for executing database operations such as querying, inserting, updating, and deleting entities.
    protected LogisticsContext Db { get; set; }
    protected IUserService UserService { get; set; }
    //protected ICache Cache { get; set; }
    //protected ILogger Log { get; set; }
    #endregion

    /// <summary>
    /// Provides a base implementation for a generic service to manage entities within the database.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity being managed, which must inherit from <see cref="DomainObject"/>.</typeparam>
    public ServiceBase() { }

    /// <summary>
    /// A base class for implementing generic service operations for managing database entities.
    /// </summary>
    /// <typeparam name="TEntity">
    /// The type of the entity the service operates on. This type must derive from <see cref="DomainObject"/>.
    /// </typeparam>
    public ServiceBase(LogisticsContext db, IUserService userService)
    {
        Db = db;
        UserService = userService;
    }

    /// <summary>
    /// Retrieves the DbSet corresponding to the type parameter <typeparamref name="TEntity"/>.
    /// </summary>
    /// <returns>
    /// The <see cref="DbSet{TEntity}"/> instance that represents the entity set of type <typeparamref name="TEntity"/>.
    /// </returns>
    protected DbSet<TEntity> Set()
    {
        var set = Db.Set<TEntity>();
        return set;
    }

    /// <summary>
    /// Retrieves the <see cref="DbSet{T}"/> corresponding to the specified entity type.
    /// </summary>
    /// <typeparam name="T">The type of the entity for which the <see cref="DbSet{T}"/> is fetched. Must inherit from <see cref="DomainObject"/>.</typeparam>
    /// <returns>A <see cref="DbSet{T}"/> instance for the specified entity type.</returns>
    protected DbSet<T> Set<T>() where T : class, IDomainObject
    {
        var set = Db.Set<T>();
        return set;
    }

    /// <summary>
    /// Changes the parent directory of a directory entry and persists the changes in the database.
    /// </summary>
    /// <typeparam name="TEntry">The type of the directory entry. Must inherit from <see cref="DirectoryEntry"/>.</typeparam>
    /// <param name="id">The unique identifier of the directory entry whose parent is to be changed.</param>
    /// <param name="newParentId">The unique identifier of the new parent directory.</param>
    /// <returns>The updated directory entry with the new parent directory assigned.</returns>
    /// <exception cref="EdmException">
    /// Thrown when the directory entry with the specified <paramref name="id"/> is not found
    /// or when the directory with the specified <paramref name="newParentId"/> is not found.
    /// </exception>
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

    /// <summary>
    /// Retrieves all entities of the specified type from the database.
    /// Optionally includes metadata fields for entities implementing the <see cref="IWithMeta"/> interface
    /// and excludes entities marked as deleted.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains a collection of entities of type <typeparamref name="TEntity"/>.</returns>
    public virtual async Task<IEnumerable<TEntity>> GetAll()
    {
        var query = Set().AsNoTracking();
        var result = await (typeof(TEntity).IsAssignableTo(typeof(IWithMeta)) ? 
                query
                    .Include(e => ((IWithMeta)e).Meta)
                    .Where(e => ((IWithMeta)e).Meta.Deleted == null) : 
                query)
            .ToListAsync();
        
        return result;
    }

    /// <summary>
    /// Retrieves an entity of type <typeparamref name="TEntity"/> by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the entity to retrieve.</param>
    /// <returns>The entity of type <typeparamref name="TEntity"/> if found; otherwise, null.</returns>
    public virtual async Task<TEntity> Get(Guid id)
    {
        var result = await Set()
            .FirstOrDefaultAsync(p => id == p.Id);
        return result;
    }

    /// <summary>
    /// Retrieves an entity of type <typeparamref name="TEntity"/> by its identifier
    /// and includes related data specified by the provided expression.
    /// </summary>
    /// <typeparam name="TInclude">The type of the related data to include.</typeparam>
    /// <param name="id">The unique identifier of the entity to retrieve.</param>
    /// <param name="include">An expression specifying the related data to include.</param>
    /// <returns>
    /// A task representing the asynchronous operation. The task result contains the
    /// entity of type <typeparamref name="TEntity"/> with the specified related data included,
    /// or null if no entity is found with the given identifier.
    /// </returns>
    public virtual async Task<TEntity> Get<TInclude>(Guid id, Expression<Func<TEntity, TInclude>> include)
    {
        var result = await Set().Include(include)
            .FirstOrDefaultAsync(p => id == p.Id);
        return result;
    }

    /// <summary>
    /// Retrieves an entity of type <typeparamref name="TEntity"/> from the database using the specified identifier
    /// and includes additional related data defined by two expressions.
    /// </summary>
    /// <typeparam name="TInclude">The type of the first related entity to include in the query.</typeparam>
    /// <typeparam name="TInclude2">The type of the second related entity to include in the query.</typeparam>
    /// <param name="id">The unique identifier of the entity to retrieve.</param>
    /// <param name="include">An expression that specifies the first related entity to include in the query.</param>
    /// <param name="include2">An expression that specifies the second related entity to include in the query.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the retrieved entity
    /// of type <typeparamref name="TEntity"/> with the specified related data included, or null if no entity is found
    /// matching the provided identifier.</returns>
    public virtual async Task<TEntity> Get<TInclude, TInclude2>(Guid id, Expression<Func<TEntity, TInclude>> include, Expression<Func<TEntity, TInclude2>> include2)
    {
        var result = await Set()
            .Include(include)
            .Include(include2)
            .FirstOrDefaultAsync(p => id == p.Id);
        return result;
    }


    /// <summary>
    /// Retrieves a collection of entities that satisfy the specified predicate and optionally includes a related entity in the result.
    /// </summary>
    /// <typeparam name="T1">The type of the related entity to include in the result.</typeparam>
    /// <param name="predicate">An expression to filter the entities.</param>
    /// <param name="include">An expression that specifies the related entity to include.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a collection of entities that match the predicate.</returns>
    public async Task<IEnumerable<TEntity>> Get<T1>(Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, T1>> include)
    {
        var request = Set().Include(include);
        var whereReq = request.Where(predicate);
        var result = await whereReq.ToListAsync();
        return result;
    }

    /// <summary>
    /// Retrieves an entity of type <typeparamref name="TEntity"/> by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the entity to be retrieved.</param>
    /// <returns>The entity of type <typeparamref name="TEntity"/> if found; otherwise, null.</returns>
    protected virtual async Task<T> Get<T>(Guid id) where T : DomainObject
    {
        var result = await Set<T>()
            .FirstOrDefaultAsync(p => id == p.Id);
        return result;
    }

    /// <summary>
    /// Retrieves a collection of entities that match the specified predicate.
    /// </summary>
    /// <param name="predicate">The condition to filter the entities.</param>
    /// <returns>A task representing the asynchronous operation. The task result contains a collection of entities matching the specified predicate.</returns>
    public virtual async Task<IEnumerable<TEntity>> Get(Expression<Func<TEntity, bool>> predicate)
    {
        var result = await Set().Where(predicate).ToListAsync();
        return result;
    }

    /// <summary>
    /// Saves the specified entity to the database. If the entity is new, it is added;
    /// otherwise, it is updated. Handles meta and history information for entities
    /// that are of type <see cref="DirectoryEntry"/>.
    /// </summary>
    /// <param name="entity">The entity to save.</param>
    /// <returns>Returns the saved entity after being persisted to the database.</returns>
    public virtual async Task<TEntity> Save(TEntity entity)
    {
        var state = entity.Id == Guid.Empty ? EntityState.Added : EntityState.Modified;
        var id = DomainObject.NewGuid();
        if (entity is IWithMeta withMeta)
        {
            if (state == EntityState.Added)
            {
                withMeta.Meta = new Meta
                {
                    Owner = UserService.GetUserName() ?? "?",
                    Metatype = typeof(TEntity).Name,
                    //Groups = model.Division == null ? [] : [model.Division]
                };
                withMeta.Id = id;
                Set().Add(entity);
            }
            else
            {
                withMeta.Meta = null!;
                var meta = await Set<Meta>().FindAsync(entity.Id) ?? 
                           throw new EdmException("Cannot find the corresponding meta information.");
                meta.Modified = DateTime.UtcNow;
                Set<History>().Add(new History
                {
                    Id = DomainObject.NewGuid(),
                    MetaId = meta.Id,
                    Author = UserService.GetUserName() ?? "?", 
                    JsonValue  = JsonConvert.SerializeObject(withMeta)
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
            
            var entry = Set().Attach(entity);
            entry.State = state;
        }

        await Db.SaveChangesAsync();
        return entity;
    }

    /// <summary>
    /// Saves the specified entity to the database. Determines if the entity should be added or modified based on the entity's ID.
    /// </summary>
    /// <typeparam name="T">The type of the entity to save. Must inherit from <see cref="DomainObject"/>.</typeparam>
    /// <param name="entity">The entity to be saved.</param>
    /// <returns>The saved entity after database operations are completed.</returns>
    protected virtual async Task<T> Save<T>(T entity) where T : DomainObject
    {
        var track = Set<T>().Attach(entity);
        track.State = entity.Id == Guid.Empty ? EntityState.Added : EntityState.Modified;
        if (entity is IWithMeta && track.State == EntityState.Added)
        {
            // (entity as DirectoryObject).IsActive = true;
        }

        await Db.SaveChangesAsync();
        return entity;
    }

    /// <summary>
    /// Deletes the specified entity from the database, either logically or physically based on the <paramref name="physical"/> parameter.
    /// For entities of type <see cref="DirectoryEntry"/>, it performs a logical deletion by updating the associated metadata.
    /// For other entity types, it performs a physical deletion.
    /// </summary>
    /// <param name="entity">The entity to be deleted.</param>
    /// <param name="physical">A boolean value indicating whether to perform a physical deletion. Defaults to false.</param>
    /// <returns>The deleted entity.</returns>
    /// <exception cref="EdmException">Thrown if the entity is null or associated metadata is not found.</exception>
    protected virtual async Task<TEntity> Delete(TEntity entity, bool physical = false)
    {
        switch (entity)
        {
            case null:
                throw new EdmException("Entity cannot be null.", new ArgumentNullException(typeof(TEntity).Name));
            case IWithMeta:
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

    /// <summary>
    /// Deletes an entity with the specified identifier logically or physically.
    /// </summary>
    /// <param name="id">The unique identifier of the entity to be deleted.</param>
    /// <returns>The deleted entity instance if found and successfully deleted; otherwise, null.</returns>
    public virtual async Task<TEntity> Delete(Guid id)
    {
        var entity = await Get(id);
        return await Delete(entity, false);
    }

    /// <summary>
    /// Deletes an entity of the specified type by its unique identifier.
    /// </summary>
    /// <typeparam name="T">The type of the entity to be deleted. Must inherit from <see cref="DomainObject"/>.</typeparam>
    /// <param name="id">The unique identifier of the entity to delete.</param>
    /// <returns>The entity that was deleted.</returns>
    protected virtual async Task<T> Delete<T>(Guid id) where T : DomainObject
    {
        var entity = await Get<T>(id);
        // TODO Make soft delete as well
        var result = Set<T>().Remove(entity);
        await Db.SaveChangesAsync();
        return entity;
    }

    /// <summary>
    /// Deletes an entity from the database by its identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the entity to be deleted.</param>
    /// <returns>The deleted entity object.</returns>
    /// <exception cref="EdmException">Thrown if the entity cannot be found or another issue occurs during deletion.</exception>
    protected virtual async Task<TEntity> Delete(Guid id, Func<TEntity, bool> isLogical)
    {
        var entity = await Get(id);
        return await Delete(entity, isLogical(entity));
    }
}