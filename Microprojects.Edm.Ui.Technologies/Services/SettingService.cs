using Microsoft.EntityFrameworkCore;
using Microprojects.Edm.Domain;
using Microprojects.Edm.Ui.Technologies.Contracts;
using Microprojects.Edm.Ui.Technologies.Models;
using Microprojects.Edm.Ui.Technologies.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Microprojects.Edm.Ui.Technologies.Services
{
    public class SettingService : ISettingService
    {
        private TechnologiesContext _db;
        public SettingService() { }

        public SettingService(TechnologiesContext db) 
        {
            _db = db;
        }

        protected async Task<Setting> GetByGuid(Guid guid, string name)
        {
            var result = await _db.Settings
                .FirstOrDefaultAsync(s => s.Guid == guid && s.Name == name);
            if (result == null)
            {
                result =  new Setting { Id = DomainObject.NewGuid(), Guid = guid, Name = name };
                _db.Settings.Add(result);
            }
            return result;
        }

        public async Task<string> Get(Guid guid, string name)
        {
            var result = await GetByGuid(guid, name);
            return result?.Value;
        }

        public Task<T> Get<T>(Guid guid, string name)
        {
            throw new NotImplementedException();
        }

        public async Task<string> Set(Guid guid, string name, string value)
        {
            var result = await GetByGuid(guid, name);
            result.Value = value;
            await _db.SaveChangesAsync();
            return value;
        }

        public Task<T> Set<T>(Guid guid, string name, T value)
        {
            throw new NotImplementedException();
        }
    }
}
