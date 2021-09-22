using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Optosense.Edm.Core.Auditing;
using Optosense.Edm.Core.Contracts;
using Optosense.Edm.Core.Models;
using Optosense.Edm.Domain.Models;
using Optosense.Edm.Webui.Models;

namespace Optosense.Edm.WebUi.Controllers
{
    public class AuthControllerBase : ControllerBase
    {
        public UserInfo UserInfo { 
            get 
            {
                var value = HttpContext.Session.GetString("UserInfo");
                var userInfo = value == null ? new UserInfo() : JsonConvert.DeserializeObject<UserInfo>(value);
                return userInfo;
            }
        }
    }
}
