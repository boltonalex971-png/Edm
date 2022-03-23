using Microsoft.EntityFrameworkCore;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.Core.Services
{
    public class SettingService : ISettingService
    {
        private EdmContext _db;
        public SettingService() { }

        public SettingService(EdmContext db) 
        {
            _db = db;
        }

        protected async Task<Setting> GetByGuid(Guid guid, string name)
        {
            var result = await _db.Settings
                .FirstOrDefaultAsync(s => s.Guid == guid && s.Name == name);
            if (result == null)
            {
                result =  new Setting { Guid = guid, Name = name };
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
