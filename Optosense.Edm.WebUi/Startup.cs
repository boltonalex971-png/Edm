using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Threading.Tasks;
using AutoMapper;
using Microprojects.Edm;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Optosense.Edm.Commands;
using Optosense.Edm.Core.AspNet;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Infrastructure;
using Optosense.Edm.Core.Infrastructure.Mapper;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Core.Services;
using Optosense.Edm.DataAccess;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Drivers.Null;
using Optosense.Edm.Infrastructure.Edm;
using Optosense.Edm.WebApi.Utils;

namespace Optosense.Edm.WebUi
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
            services.AddAutoMapper(typeof(AutoMapperProfile), typeof(Startup));
            services.AddCors(options =>
            {
                options.AddPolicy("DevCorsPolicy", builder =>
                {
                    builder.AllowAnyOrigin();
                    builder.AllowAnyHeader();
                    builder.AllowAnyMethod();
                });
            });
            services.AddControllers(options =>
            {
                options.RespectBrowserAcceptHeader = true;
            }).AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
                options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
            });
            //services.AddControllersWithViews();
            //services.AddSpaStaticFiles();
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/build";
            });
            services.AddDbContext<EdmContext>(options =>
            {
                options.UseSqlServer(Configuration.GetConnectionString("Edm"));
            });

            services.AddEdmCommands(c => c
                .SetPluginAssemblies(typeof(RemoteCommands).Assembly, typeof(StartDeviceCommand).Assembly)
                .SetLoadContext(typeof(OptosenseLoadContext))
                .SetDefaultLogger(new ConsoleLogger())
            );


            services.InjectDeps();
            services.AddPlugins(config =>
            {
                config.BaseDirectory = AppContext.BaseDirectory;
                config.PluginsPath = new[]
                {
                    ".\\Optosense.Edm.Drivers.Null.dll",
                    ".\\Optosense.Edm.Profiles.Board.dll",
                    ".\\Optosense.Edm.Operations.Test.dll"
                }; //AppContext.BaseDirectory;
                Console.WriteLine($"Edm plugins base directory is '{config.PluginsPath}'");
            });

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            if (env.IsProduction())
            {
                app.UseHttpsRedirection();
            }
            app.UseCors("DevCorsPolicy");
            app.UseStaticFiles();
            app.UseSpaStaticFiles();
            app.UseRouting();

            //app.UseAuthorization();
            //app.UseMvc();
            app.ApplicationServices.GetService<ICommandContainer>();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            //if (env.IsProduction())
            //{
            app.MapSpaPlugins();
            //}
            //else
            //{
            //    app.MapSpa();
            //}

            // This part is for EDM central
            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseReactDevelopmentServer(npmScript: "start");
                }
            });
        }

    }

    static class Extensions
    {

        public static IServiceCollection InjectDeps(this IServiceCollection services)
        {
            services.AddScoped<IEdmContext>(provider => provider.GetService<EdmContext>());

            services.AddTransient<IRemoteCommands, RemoteCommands>();

            services.AddTransient<IAuditService, AuditService>();
            services.AddTransient<IProcessService, ProcessService>();
            services.AddTransient<IHostService, HostService>();
            services.AddTransient<IDeviceService, DeviceService>();
            services.AddTransient<IWorkplaceService, WorkplaceService>();
            services.AddTransient<IProfileService, ProfileService>();
            services.AddTransient<IOperationService, OperationService>();
            services.AddTransient<ISettingService, SettingService>();

            return services;
        }

        public static void JsonConfigure(this IApplicationBuilder app)
        {
            JsonConvert.DefaultSettings = () => new JsonSerializerSettings
            {
                //ContractResolver = new CustomResolver(),
                //PreserveReferencesHandling = PreserveReferencesHandling.None,
                ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                Formatting = Formatting.None,
                NullValueHandling = NullValueHandling.Ignore
            };
        }

        class CustomResolver : DefaultContractResolver
        {
            protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
            {
                JsonProperty prop = base.CreateProperty(member, memberSerialization);

                if (prop.PropertyType.IsClass && prop.PropertyType.IsInstanceOfType(typeof(DomainObject)))
                {
                    prop.ShouldSerialize = obj => false;
                }

                return prop;
            }
        }
    }
}
