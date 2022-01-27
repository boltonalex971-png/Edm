using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Loader;
using System.Threading.Tasks;
using Microprojects.Edm;
using Microprojects.Edm.Cache;
using Microprojects.Edm.Cache.Redis;
using Microprojects.Edm.Jobs;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Optosense.Edm.Core.AspNet;
using Optosense.Edm.Jobs;
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

            services.AddPlugins(config =>
            {
                config.BaseDirectory = AppContext.BaseDirectory;
                config.PluginsPath = Configuration.GetSection("Edm:Assemblies").GetChildren().Select(c => c.Value);
                config.Configuration = Configuration;
            });

            services.AddJobs();
            
            services.Configure<Peer>(options =>
            {
                var section = Configuration.GetSection("Kestrel:Endpoints").GetChildren();
                var grpcUri = new Uri(section.First(s => s.Key.StartsWith("Grpc"))["Url"]);
                var uiUri = new Uri(section.First(s => s.Key.StartsWith("Http"))["Url"]);
                options.Host = $"{uiUri.Scheme}://{uiUri.Host}";
                options.GrpcPort = grpcUri.Port;
                options.UiPort = uiUri.Port;
                options.Version = GetType().Assembly.GetName().Version.ToString();
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
        public void Configure(IApplicationBuilder app, IJobContainer jobContainer)
        {
            // Run job container
            jobContainer.Start();

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
                endpoints.MapGrpcService<EdmJobService>();
            });
            app.MapSpaPlugins();
        }
    }
}
