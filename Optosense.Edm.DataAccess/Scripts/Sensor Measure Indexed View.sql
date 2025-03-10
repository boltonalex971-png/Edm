CREATE VIEW dbo.SensorMeasure
WITH SCHEMABINDING AS
SELECT
	COUNT_BIG(*) AS Count,
	OperationHostDeviceId,
	h.OperationId,
	o.Started,
	JSON_VALUE(r.Parameters, '$.ADDR') as Addr,
	SUM(CAST(ISNULL(JSON_VALUE(r.Parameters, '$.Sn'),0) AS int)) as Sn,
	SUM(CAST(ISNULL(JSON_VALUE(r.Parameters, '$.Signal'),0) AS int)) as Signal,
	SUM(CAST(ISNULL(JSON_VALUE(r.Parameters, '$.Ref'),0) AS int)) as Ref,
	SUM(CAST(ISNULL(JSON_VALUE(r.Parameters, '$.PW'),0) AS int)) as Pw
FROM dbo.Records r
JOIN dbo.OperationHostDevices h ON h.Id=r.OperationHostDeviceId
JOIN dbo.Operations o ON o.Id=h.OperationId
WHERE JSON_VALUE(r.Parameters, '$.Sn') IS NOT NULL or JSON_VALUE(r.Parameters, '$.PW') IS NOT NULL 
GROUP BY h.OperationId, o.Started, OperationHostDeviceId, JSON_VALUE(r.Parameters, '$.ADDR')
--ORDER BY OperationHostDeviceId, Addr, Sn

GO

CREATE UNIQUE CLUSTERED INDEX PK_SensorMeasures ON SensorMeasure (OperationHostDeviceId, Addr)

GO

CREATE INDEX IX_SensorMeasure_Sn ON SensorMeasure (Sn)
INCLUDE (Signal, Ref, Pw)

GO

-- Use view SensorMeasureView for better performance
CREATE VIEW dbo.SensorMeasureView AS
SELECT
	[Count],
	OperationHostDeviceId,
	OperationId,
	Started,
	Addr,
	Sn,
	Signal,
	Ref,
	Pw, 
	Message = CASE 
		WHEN Count<=1 THEN 'Not enough measures'
		WHEN Count>2 THEN 'Too many measures'
		END
FROM dbo.SensorMeasure
WITH (NOEXPAND)
WHERE Sn>0 AND Pw>0 AND Count=2

GO

--SET STATISTICS IO ON
--GO

select * from SensorMeasureView
where 
	--Sn=1224335 --AND 
	Sn>=1200000 AND Sn<=1300000

select * from SensorMeasureView
where OperationHostDeviceId=2223

select * from SensorMeasureView
where Started>'2025-01-30 12:12:37.3930000' AND Started<='2025-01-31 12:12:37.3930000'


