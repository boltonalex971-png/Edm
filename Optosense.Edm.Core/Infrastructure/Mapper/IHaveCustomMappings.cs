using AutoMapper;

namespace Optosense.Edm.Core.Infrastructure.Mapper
{
    public interface IHaveCustomMapping
    {
        void CreateMappings(Profile configuration);
    }
}
