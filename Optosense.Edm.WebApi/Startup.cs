using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Loader;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Cache.Redis;
using Microsoft.AspNetCore.Authentication.Negotiate;
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
        public IWebHostEnvironment Env { get; }

        public Startup(IConfiguration configuration, IWebHostEnvironment env)
        {
            Configuration = configuration;
            Env = env;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddSingleton<ICache>(new RedisCache(Configuration["Edm:Cache:Default:ConnectionString"]));
            services.AddGrpc();

            services.AddEdmCommands(c =>
                c.SetPluginAssemblies(
                    typeof(RemoteCommands).Assembly,
                    typeof(StartDeviceCommand).Assembly));

            services.AddPlugins(config =>
            {
                config.BaseDirectory = AppContext.BaseDirectory;
                config.PluginsPath = Configuration.GetSection("Edm:Assemblies").GetChildren().Select(c => c.Value);
                config.Configuration = Configuration;
            });

            services.AddCors(options =>
            {
                options.AddPolicy("DevCorsPolicy", builder =>
                {
                    builder.AllowAnyOrigin();
                    builder.AllowAnyHeader();
                    builder.AllowAnyMethod();
                });
            });

            services.AddDistributedMemoryCache()
                .AddSession(session => session.IdleTimeout = TimeSpan.FromMinutes(10));
            if (Env.IsProduction())
            {
                services.AddAuthentication(NegotiateDefaults.AuthenticationScheme).AddNegotiate();
            }
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app)
        {
            if (Env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.JsonConfigure();
            app.UseCors("DevCorsPolicy");
            app.UseSession();
            app.UseRouting();
            if (Env.IsProduction())
            {
                app.UseHttpsRedirection();
                app.UseHsts();
                app.UseAuthentication();
                app.UseAuthorization();
                app.UseAuthenticatedUserInfo();
            }
            else
            {
                app.UseFakeUserInfo();
            }

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGrpcService<EdmCommandService>();
            });
            app.MapSpaPlugins();
            // Run command container
            app.ApplicationServices.GetService<ICommandContainer>().Start();
        }
    }
}
