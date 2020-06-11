using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SpaServices.ReactDevelopmentServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Infrastructure.Mapper;
using Optosense.Edm.Core.Persistance;
using Optosense.Edm.Core.Services;
using Optosense.Edm.DataAccess;

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
            services.AddControllers().AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
                options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
            });
            services.AddControllersWithViews();
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/build";
            });
            services.AddDbContext<EdmContext>(options =>
            {
                options.UseSqlServer(Configuration.GetConnectionString("Edm"));
            });
            services.InjectDeps();
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
            app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseSpaStaticFiles();
            app.UseOperations();
            app.UseRouting();

            //app.UseAuthorization();
            //app.UseMvc();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                //endpoints.MapControllerRoute(
                //    name: "default",
                //    pattern: "{controller=Home}/{action=Index}/{id?}");
                //endpoints.MapControllerRoute(
                //    name: "api",
                //    pattern: "api/{controller}/{action}");
            });

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

    //class AutoMapperProfile : Profile
    //{
    //    public AutoMapperProfile()
    //    {
    //        LoadStandardMappings();
    //        LoadCustomMappings();
    //        LoadConverters();
    //    }

    //    private void LoadConverters()
    //    {
    //    }

    //    private void LoadStandardMappings()
    //    {
    //        var mapsFrom = MapperProfileHelper.LoadStandardMappings(Assembly.GetExecutingAssembly());

    //        foreach (var map in mapsFrom)
    //        {
    //            CreateMap(map.Source, map.Destination).ReverseMap();
    //        }
    //    }

    //    private void LoadCustomMappings()
    //    {
    //        var mapsFrom = MapperProfileHelper.LoadCustomMappings(Assembly.GetExecutingAssembly());

    //        foreach (var map in mapsFrom)
    //        {
    //            map.CreateMappings(this);
    //        }
    //    }
    //}

    static class Extensions
    {
        public static void UseOperations(this IApplicationBuilder builder)
        {
            string codeBase = Assembly.GetExecutingAssembly().CodeBase;
            UriBuilder uri = new UriBuilder(codeBase);
            string path = Path.GetDirectoryName(Uri.UnescapeDataString(uri.Path));
            foreach (var assPath in Directory.GetFiles(path, "Optosense.Edm.Operations.*.dll"))
            {
                var fileName = Path.GetFileNameWithoutExtension(assPath);
                var packageName = fileName.Replace("Optosense.Edm.Operations.", string.Empty);
                builder.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new ManifestEmbeddedFileProvider(Assembly.Load($"Optosense.Edm.Operations.{packageName}"), "build"),
                    RequestPath = $"/apps/{packageName.ToLower()}"
                });
            }
        }

        public static IServiceCollection InjectDeps(this IServiceCollection services)
        {
            services.AddScoped<IEdmContext>(provider => provider.GetService<EdmContext>());
            services.AddTransient<IProcessService, ProcessService>();
            services.AddTransient<IHostService, HostService>();
            services.AddTransient<IDeviceService, DeviceService>();
            services.AddTransient<IWorkplaceService, WorkplaceService>();

            return services;
        }
    }
}
