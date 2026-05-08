using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Microprojects.Edm.Ui.Hub.Controllers
{
    /// <summary>
    /// Surfaces the platform's product version (stamped from the Setup vdproj
    /// at compile time) so the landing-page footer can display it.
    /// </summary>
    [ApiController]
    [AllowAnonymous]
    [Route("api/hub/[controller]")]
    public class MetaController : ControllerBase
    {
        [HttpGet("version")]
        public IActionResult GetVersion()
        {
            return Ok(new { product = BuildInfo.ProductVersion });
        }
    }
}
