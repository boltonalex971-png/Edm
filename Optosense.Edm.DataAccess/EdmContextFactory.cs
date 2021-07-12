using Optosense.Edm.Core.Persistance;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Optosense.Edm.DataAccess
{
    public class EdmContextFactory : IEdmContextFactory
    {
        private string _connectionString;
        public EdmContextFactory(string connectionString) => _connectionString = connectionString;
        public IEdmContext Create() => new EdmContext(_connectionString);
    }
}
