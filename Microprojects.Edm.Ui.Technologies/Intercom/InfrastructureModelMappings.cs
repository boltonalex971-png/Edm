using Microprojects.Edm.Ui.Technologies.Models;

namespace Microprojects.Edm.Ui.Technologies.Intercom;

public static class InfrastructureModelMappings
{
    public static OperationAuditData ToAuditData(this OperationCriterion s) =>
        new OperationAuditData
        {
            Id = s.Id,
            Valid = s.Valid,
            Result = s.Result,
            Message = s.Message,
            Selector = s.Selector,
            AuditCriterionParam = s.AuditCriterion?.Param,
            AuditCriterionFunction = s.AuditCriterion?.Function,
            AuditCriterionArg1 = s.AuditCriterion?.Arg1,
            AuditCriterionArg2 = s.AuditCriterion?.Arg2,
            ZoneAuditCriterionOffset = s.AuditCriterion?.Zone?.Offset ?? 0,
            ZoneAuditCriterionDuration = s.AuditCriterion?.Zone?.Duration ?? 0,
        };

    public static OperationDeviceData ToDeviceData(this Record s) =>
        new OperationDeviceData
        {
            Id = s.Id,
            OperationHostDeviceId = s.OperationHostDeviceId,
            ScheduledAt = s.ScheduledAt,
            ExecutedAt = s.ExecutedAt,
            Request = s.Request,
            Response = s.Response,
            Status = s.Status.ToString(),
            IsValid = s.IsValid,
            Parameters = s.Parameters,
        };
}
