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
using Optosense.Edm.Attributes;
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

            EdmConfig.Configure(c => c.SetPluginAssemblies(typeof(RemoteCommands).Assembly)
                .SetLoadContext(typeof(OptosenseLoadContext))
                .SetDefaultLogger(new ConsoleLogger()));

            services.InjectDeps();
            services.AddOperationPlugins(config =>
            {
                config.PluginsPath = AppContext.BaseDirectory;
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
        private static IEnumerable<Type> Plugins { get; set; }
        internal class OperationPluginsConfig
        {
            public string PluginsPath { get; set; }
        }

        private static IEnumerable<Type> CollectOperationPlugins(string path)
        {
            var p = new NullDriver();
            var plugins = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(a => a.GetTypes().Where(t => t.GetCustomAttribute<PluginAttribute>() != null));
            return plugins;
        }

        public static void AddOperationPlugins(this IServiceCollection service, Action<OperationPluginsConfig> config)
        {
            if (config == null)
            {
                throw new EdmException("Startup: Configuration action must be provided");
            }
            var conf = new OperationPluginsConfig();
            config.Invoke(conf);
            if (conf.PluginsPath == null)
            {
                throw new EdmException("Startup: 'PluginsPath' option must be specified");
            }
            Plugins = CollectOperationPlugins(conf.PluginsPath);
        }

        public static void MapSpaPlugins(this IApplicationBuilder builder)
        {
            if (Plugins == null)
            {
                throw new EdmException("Startup: Operation plugins must be located by 'IServiceCollection.AddOperationPlugins' method");
            }
            foreach (var plugin in Plugins)
            {
                builder.MapSpa(plugin);
            }
        }

        public static void MapSpa(this IApplicationBuilder builder, Type plugin)
        {
            var attr = plugin.GetCustomAttribute<PluginAttribute>();
            var name = plugin.Assembly.GetName().Name;
            var packageName = name.Substring(name.LastIndexOf('.') + 1);
            var pluginPath = $"/{attr.UiRoot}/{packageName.ToLower()}";
            var fileProvider = new ManifestEmbeddedFileProvider(plugin.Assembly, attr.UiPath);
            builder.Use((context, next) =>
            {
                if (context.Request.Path.StartsWithSegments(pluginPath, out var remain))
                {
                    var fileInfo = fileProvider.GetFileInfo(remain);
                    if (!fileInfo.Exists)
                    {
                        context.Request.Path = new PathString($"{pluginPath}/index.html");
                    }
                }
                return next();
            });

            builder.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = fileProvider,
                RequestPath = new PathString(pluginPath)
            });
        }

        public static IServiceCollection InjectDeps(this IServiceCollection services)
        {
            services.AddScoped<IEdmContext>(provider => provider.GetService<EdmContext>());

            services.AddTransient<IRemoteCommands, RemoteCommands>();
            services.AddSingleton<ICommandContainer>(CommandManager.GetInstance());

            services.AddTransient<IAuditService, AuditService>();
            services.AddTransient<IProcessService, ProcessService>();
            services.AddTransient<IHostService, HostService>();
            services.AddTransient<IDeviceService, DeviceService>();
            services.AddTransient<IWorkplaceService, WorkplaceService>();
            services.AddTransient<IProfileService, ProfileService>();
            services.AddTransient<IOperationService, OperationService>();

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
