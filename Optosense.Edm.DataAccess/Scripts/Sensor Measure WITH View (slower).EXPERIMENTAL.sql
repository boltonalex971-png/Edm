CREATE VIEW dbo.SensorMeasure
WITH SCHEMABINDING AS
WITH Measures AS (
	SELECT 
	--	r.Id as RecordId,  
		r.OperationHostDeviceId, 
		o.HostDeviceId, o.OperationId, 
		MAX(JSON_VALUE(r.Parameters, '$.Sn')) as Sn, 
		JSON_VALUE(r.Parameters, '$.ADDR') as Addr,
		MAX(JSON_VALUE(r.Parameters, '$.Signal')) as Signal,
		MAX(JSON_VALUE(r.Parameters, '$.Ref')) as Ref,
		MAX(JSON_VALUE(r.Parameters, '$.PW')) as Pw
	from dbo.Records r 
	join dbo.OperationHostDevices o on o.Id=r.OperationHostDeviceId
	where JSON_VALUE(r.Parameters, '$.Sn') IS NOT NULL or JSON_VALUE(r.Parameters, '$.PW') IS NOT NULL
	group by OperationId, HostDeviceId, OperationHostDeviceId, JSON_VALUE(r.Parameters, '$.ADDR')
),
Latest AS (
	SELECT 
		MAX(OperationId) AS MaxOperationId,
		Measures.Sn
	FROM Measures
	WHERE Measures.Sn IS NOT NULL and Pw IS NOT NULL
	GROUP BY Measures.Sn
)
SELECT 
	m.OperationId,
	m.HostDeviceId,
	m.OperationHostDeviceId,
	m.Addr,
	m.Sn,
	m.Signal,
	m.Ref,
	m.Pw
FROM Latest l
JOIN Measures m on m.OperationId=l.MaxOperationId and m.Sn=l.Sn
--WHERE Measures.OperationId=(SELECT MaxOperationId FROM Latest WHERE Sn=Measures.Sn)
--ORDER BY OperationId, Addr, l.Sn

GO;

-- Error: WITH (CTE) cannot be used   
CREATE UNIQUE CLUSTERED INDEX PK_SensorMeasures ON SensorMeasure (OperationId, Sn)

