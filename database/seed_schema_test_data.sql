-- ============================================
-- Schema测试数据生成脚本
-- 说明：为测试报表发布功能，需要创建真实的Schema文件
-- 执行方式：
--   1. 先执行此SQL更新数据库中的schema_file路径
--   2. 然后运行Java脚本或手动创建对应的文件
-- ============================================

-- 注意：此脚本假设schema文件已经创建在文件系统中
-- 文件路径格式：./schema-storage/{reportId}_{hash前8位}.json
-- 如果文件不存在，需要先运行 seed_schema_files.sh 或使用Java工具创建

-- ============================================
-- 更新报表的schema_file路径
-- ============================================

-- report-001: 月度销售报表 (已发布)
UPDATE report 
SET schema_file = './schema-storage/report-001_a1b2c3d4.json'
WHERE report_id = 'report-001';

-- report-002: 销售趋势分析 (已发布)
UPDATE report 
SET schema_file = './schema-storage/report-002_e5f6g7h8.json'
WHERE report_id = 'report-002';

-- report-003: 区域销售对比 (草稿，用于测试发布功能)
UPDATE report 
SET schema_file = './schema-storage/report-003_i9j0k1l2.json'
WHERE report_id = 'report-003';

-- report-004: 财务报表汇总 (已发布)
UPDATE report 
SET schema_file = './schema-storage/report-004_m3n4o5p6.json'
WHERE report_id = 'report-004';

-- report-005: 成本分析报表 (草稿，用于测试发布功能)
UPDATE report 
SET schema_file = './schema-storage/report-005_q7r8s9t0.json'
WHERE report_id = 'report-005';

-- report-006: 运营实时监控 (已发布)
UPDATE report 
SET schema_file = './schema-storage/report-006_u1v2w3x4.json'
WHERE report_id = 'report-006';

-- report-007: 库存统计报表 (已发布)
UPDATE report 
SET schema_file = './schema-storage/report-007_y5z6a7b8.json'
WHERE report_id = 'report-007';

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
        ELSE '✅ Schema文件路径已设置'
    END AS status_check
FROM report
ORDER BY report_id;

