using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Optosense.Edm.Operations.Test;

namespace Optosense.Edm.Operations.Test.Controllers
{
    [ApiController]
    [Route("/apps/[controller]")]
    public class TestMonitorController : ControllerBase
    {
        private static readonly string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        private readonly ILogger<TestMonitorController> _logger;

        public TestMonitorController(ILogger<TestMonitorController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public IEnumerable<WeatherForecast> Get()
        {
            var rng = new Random();
            return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateTime.Now.AddDays(index),
                TemperatureC = rng.Next(-20, 55),
                Summary = Summaries[rng.Next(Summaries.Length)]
            })
            .ToArray();
        }

        //[HttpGet("view")]
        //public ActionResult Index()
        //{
        //    //return View();
        //}

        [HttpGet("options")]
        public ContentResult Options()
        {
            var page = @"
                <html>
                    <body>
                        Hello world!
                    </body>
                </html>";
            return Content(page, "text/html");
        }
    }
}
