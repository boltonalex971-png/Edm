using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    // Legacy int-PK ServiceBase. Used by Profile/Audit/Operation/Setting/Workbench
    // and their friends until they flip to Guid in later phases. Host/Device/
    // Process/Workplace services inherit Shared.Services.ServiceBase directly.
    public class ServiceBase<TEntity> : ILegacyIntGenericService<TEntity>
        where TEntity : LegacyIntDomainObject
    {
        protected TechnologiesContext Db { get; set; }

        public ServiceBase() { }

        public ServiceBase(TechnologiesContext db)
        {
            Db = db;
        }

        protected DbSet<TEntity> Set() => Db.Set<TEntity>();

        protected DbSet<T> Set<T>() where T : LegacyIntDomainObject => Db.Set<T>();

        public virtual async Task<IEnumerable<TEntity>> GetAll()
        {
            var query = Set().AsNoTracking();
            if (typeof(TypeObject).IsAssignableFrom(typeof(TEntity)))
            {
                query = query.Where(p => ((TypeObject)(object)p).IsActive);
            }
            return await query.ToListAsync();
        }

        public virtual async Task<TEntity> Get(int id) =>
            await Set().FirstOrDefaultAsync(p => id == p.Id);

        public virtual async Task<TEntity> Get<TInclude>(int id, Expression<Func<TEntity, TInclude>> include) =>
            await Set().Include(include).FirstOrDefaultAsync(p => id == p.Id);

        public virtual async Task<TEntity> Get<TInclude, TInclude2>(int id,
            Expression<Func<TEntity, TInclude>> include, Expression<Func<TEntity, TInclude2>> include2) =>
            await Set().Include(include).Include(include2).AsSplitQuery().FirstOrDefaultAsync(p => id == p.Id);

        public async Task<IEnumerable<TEntity>> Get<T1>(Expression<Func<TEntity, bool>> predicate,
            Expression<Func<TEntity, T1>> include) =>
            await Set().Include(include).Where(predicate).ToListAsync();

        public async Task<IEnumerable<TEntity>> Get<T1, T2>(Expression<Func<TEntity, bool>> predicate,
            Expression<Func<TEntity, T1>> include, Expression<Func<TEntity, T2>> include2) =>
            await Set().Include(include).Include(include2).Where(predicate).ToListAsync();

        protected virtual async Task<T> Get<T>(int id) where T : LegacyIntDomainObject =>
            await Set<T>().FirstOrDefaultAsync(p => id == p.Id);

        public virtual async Task<IEnumerable<TEntity>> Get(Expression<Func<TEntity, bool>> predicate) =>
            await Set().Where(predicate).ToListAsync();

        public virtual async Task<TEntity> Save(TEntity entity)
        {
            var track = Set().Attach(entity);
            track.State = entity.Id == 0 ? EntityState.Added : EntityState.Modified;
            if (entity is TypeObject typeObject && track.State == EntityState.Added)
            {
                typeObject.IsActive = true;
            }
            await Db.SaveChangesAsync();
            return entity;
        }

        protected virtual async Task<T> Save<T>(T entity) where T : LegacyIntDomainObject
        {
            var track = Set<T>().Attach(entity);
            track.State = entity.Id == 0 ? EntityState.Added : EntityState.Modified;
            if (entity is TypeObject typeObject && track.State == EntityState.Added)
            {
                typeObject.IsActive = true;
            }
            await Db.SaveChangesAsync();
            return entity;
        }

        protected virtual async Task<TEntity> Delete(TEntity entity, bool physical = false)
        {
            if (entity is null)
            {
                return entity;
            }

            if (physical)
            {
                Set().Remove(entity);
            }
            else if (entity is TypeObject typeObject)
            {
                typeObject.IsActive = false;
            }
            else
            {
                Set().Remove(entity);
            }
            await Db.SaveChangesAsync();
            return entity;
        }

        public virtual async Task<TEntity> Delete(int id)
        {
            var entity = await Get(id);
            return await Delete(entity, false);
        }

        protected virtual async Task<T> Delete<T>(int id) where T : LegacyIntDomainObject
        {
            var entity = await Get<T>(id);
            Set<T>().Remove(entity);
            await Db.SaveChangesAsync();
            return entity;
        }

        protected virtual async Task<TEntity> Delete(int id, Func<TEntity, bool> isLogical)
        {
            var entity = await Get(id);
            return await Delete(entity, isLogical(entity));
        }
    }
}
