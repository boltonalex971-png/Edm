using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System;
using Microprojects.Edm.Ui.Logistics.Contracts;
using Microprojects.Edm.Ui.Logistics.Models;
using Microprojects.Edm.Ui.Logistics.Persistence;

namespace Microprojects.Edm.Ui.Logistics.Services;

public class ProcessService : ServiceBase<Process>, IProcessService
{
    #region injected properties

    //protected IIstpContextFactory ContextFactory { get; set; }
    //private IProfileServic _profileService { get; set; }
    //private IHierarchyService _hierarchyService;

    #endregion

    public ProcessService()
    {
    }

    public ProcessService(LogisticsContext db) : base(db)
    {
    }
}