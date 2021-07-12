using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Loader;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Cache.Redis;
using Microprojects.Edm.Log;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Optosense.Edm.Commands;
using Optosense.Edm.Core.AspNet;
using Optosense.Edm.Infrastructure.Edm;
using Optosense.Edm.WebApi.Services;
using Optosense.Edm.WebApi.Utils;

namespace Optosense.Edm.WebApi
{
    public class Startup
    {
        public IConfiguration Configuration { get; }

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton<ICache>(new RedisCache(Configuration["Edm:Cache:Default:ConnectionString"]));
            services.AddGrpc();
            services.AddControllers();

            services.AddEdmCommands(c => c
                .SetPluginAssemblies(typeof(RemoteCommands).Assembly, typeof(StartDeviceCommand).Assembly)
                .SetDefaultLogger(new ConsoleLogger())
            );

            services.AddPlugins(config =>
            {
                config.BaseDirectory = AppContext.BaseDirectory;
                config.PluginsPath = Configuration.GetSection("Edm:Assemblies").GetChildren().Select(c => c.Value);
            });


        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.JsonConfigure();
            app.UseRouting();
            //app.UseHttpsRedirection();
            //app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapGrpcService<EdmCommandService>();
                endpoints.MapGet("/", async context =>
                {
                    await context.Response.WriteAsync("Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");
                });
            });
            app.MapSpaPlugins();
        }
    }
}
