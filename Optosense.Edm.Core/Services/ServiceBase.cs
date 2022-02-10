using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class ServiceBase<TEntity> : IGenericService<TEntity> where TEntity : TypeObject
    {
        #region Injected Properties
        protected IEdmContext Db { get; set; }
        //protected ICache Cache { get; set; }
        //protected ILogger Log { get; set; }
        #endregion

        public ServiceBase() { }

        public ServiceBase(IEdmContext db)
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

        public virtual async Task<IEnumerable<TEntity>> GetAll() 
        {
            var result = await Set().AsNoTracking()
                .Where(p => p.IsActive)
                .ToListAsync();
            return result;
        }

        public virtual async Task<TEntity> Get(int id)
        {
            var result = await Set()
                .FirstOrDefaultAsync(p => id == p.Id);
            return result;
        }

        public virtual async Task<TEntity> Get<TInclude>(int id, Expression<Func<TEntity, TInclude>> include)
        {
            var result = await Set().Include(include)
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

        protected virtual async Task<T> Get<T>(int id) where T : DomainObject
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
            var track = Set().Attach(entity);
            track.State = entity.Id == 0 ? EntityState.Added : EntityState.Modified;
            if (entity is TypeObject && track.State == EntityState.Added)
            {
                (entity as TypeObject).IsActive = true;
            }

            await Db.SaveChangesAsync();
            return entity;
        }

        protected virtual async Task<T> Save<T>(T entity) where T : DomainObject
        {
            var track = Set<T>().Attach(entity);
            track.State = entity.Id == 0 ? EntityState.Added : EntityState.Modified;
            if (entity is TypeObject && track.State == EntityState.Added)
            {
                (entity as TypeObject).IsActive = true;
            }

            await Db.SaveChangesAsync();
            return entity;
        }

        protected virtual async Task<TEntity> Delete(TEntity entity, bool physical = false)
        {
            if (entity is not null)
            {
                if (physical)
                {
                    Set().Remove(entity);
                }
                else
                {
                    entity.IsActive = false;
                }
                await Db.SaveChangesAsync();
            }

            return entity;
        }

        public virtual async Task<TEntity> Delete(int id)
        {
            var entity = await Get(id);
            return await Delete(entity, false);
        }

        protected virtual async Task<T> Delete<T>(int id) where T : DomainObject
        {
            var entity = await Get<T>(id);
            // TODO Make soft delete as well
            var result = Set<T>().Remove(entity);
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
