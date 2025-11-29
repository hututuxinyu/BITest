-- ============================================
-- 修复Schema文件路径脚本
-- 说明：将数据库中的旧路径格式更新为正确的相对路径
-- 执行方式：psql -U postgres -d biservice -f database/fix_schema_paths.sql
-- ============================================

-- 更新所有报表的schema_file路径为正确的相对路径格式
-- 从旧格式（如 /schema/reports/report-001.json）更新为新格式（如 ./schema-storage/report-001_a1b2c3d4.json）

UPDATE report 
SET schema_file = './schema-storage/report-001_a1b2c3d4.json'
WHERE report_id = 'report-001' 
  AND (schema_file LIKE '/schema/reports/report-001.json' OR schema_file IS NULL);

UPDATE report 
SET schema_file = './schema-storage/report-002_e5f6g7h8.json'
WHERE report_id = 'report-002' 
  AND (schema_file LIKE '/schema/reports/report-002.json' OR schema_file IS NULL);

UPDATE report 
SET schema_file = './schema-storage/report-003_i9j0k1l2.json'
WHERE report_id = 'report-003' 
  AND (schema_file LIKE '/schema/reports/report-003.json' OR schema_file IS NULL);

UPDATE report 
SET schema_file = './schema-storage/report-004_m3n4o5p6.json'
WHERE report_id = 'report-004' 
  AND (schema_file LIKE '/schema/reports/report-004.json' OR schema_file IS NULL);

UPDATE report 
SET schema_file = './schema-storage/report-005_q7r8s9t0.json'
WHERE report_id = 'report-005' 
  AND (schema_file LIKE '/schema/reports/report-005.json' OR schema_file IS NULL);

UPDATE report 
SET schema_file = './schema-storage/report-006_u1v2w3x4.json'
WHERE report_id = 'report-006' 
  AND (schema_file LIKE '/schema/reports/report-006.json' OR schema_file IS NULL);

UPDATE report 
SET schema_file = './schema-storage/report-007_y5z6a7b8.json'
WHERE report_id = 'report-007' 
  AND (schema_file LIKE '/schema/reports/report-007.json' OR schema_file IS NULL);

-- ============================================
-- 验证更新结果
-- ============================================
SELECT 
    report_id,
    report_name,
    status,
    schema_file,
    CASE 
        WHEN schema_file IS NULL THEN '❌ 缺少Schema文件路径'
        WHEN schema_file LIKE './schema-storage/%' THEN '✅ Schema文件路径正确'
        WHEN schema_file LIKE '/schema/reports/%' THEN '⚠️ 旧路径格式，需要更新'
        ELSE '⚠️ 路径格式异常'
    END AS status_check
FROM report
ORDER BY report_id;

