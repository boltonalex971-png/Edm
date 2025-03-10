CREATE VIEW dbo.SensorMeasureIndexedView
WITH SCHEMABINDING AS
SELECT 
	s.OpId,
	s.Sn, 
	m.Addr,
	m.Signal,
	m.Ref,
	m.Pw
FROM (
	SELECT 	
		JSON_VALUE(r.Parameters, '$.Sn') Sn, 
		MAX(OperationHostDeviceId) OpId
	FROM
		dbo.Records r 
		--join dbo.OperationHostDevices o on o.Id=r.OperationHostDeviceId
		where JSON_VALUE(r.Parameters, '$.Sn') IS NOT NULL
		group by 
			JSON_VALUE(r.Parameters, '$.Sn')
) s
INNER JOIN (
	SELECT
		OperationHostDeviceId,
		JSON_VALUE(r.Parameters, '$.ADDR') as Addr,
		MAX(JSON_VALUE(r.Parameters, '$.Sn')) as Sn,
		MAX(JSON_VALUE(r.Parameters, '$.Signal')) as Signal,
		MAX(JSON_VALUE(r.Parameters, '$.Ref')) as Ref,
		MAX(JSON_VALUE(r.Parameters, '$.PW')) as Pw
	FROM dbo.Records r
	--WHERE JSON_VALUE(r.Parameters, '$.Sn') IS NOT NULL or JSON_VALUE(r.Parameters, '$.PW') IS NOT NULL
	GROUP BY OperationHostDeviceId, JSON_VALUE(r.Parameters, '$.ADDR')
) m
ON s.OpId=m.OperationHostDeviceId AND m.Sn=s.Sn
WHERE 
	m.Pw IS NOT NULL AND 
	m.Signal IS NOT NULL AND 
	m.Ref IS NOT NULL
--ORDER BY OperationHostDeviceId, Addr

GO; 

-- Error: JOIN cannot be used   
CREATE UNIQUE CLUSTERED INDEX PK_SensorMeasuresIndexedView ON SensorMeasureIndexedView (OpId, Sn)