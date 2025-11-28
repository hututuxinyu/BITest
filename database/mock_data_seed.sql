-- 设置客户端编码为UTF-8
SET client_encoding = 'UTF8';

INSERT INTO "user" (user_id, username, email, password_hash, status, create_time)
VALUES (
    'user-001',
    'admin',
    'admin@example.com',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pJ5aC',
    'active',
    CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO project (
    project_id, 
    project_name, 
    description, 
    project_type,
    user_id, 
    create_time, 
    update_time, 
    report_count,
    last_report_update_time, 
    codehub_repository, 
    codehub_branch,
    codehub_path, 
    status
) VALUES
    (
        'project-001', 
        '销售数据分析工程', 
        '用于分析销售数据的BI报表工程', 
        'private',
        'user-001', 
        '2024-01-15 10:30:00'::TIMESTAMP, 
        '2024-01-20 14:20:00'::TIMESTAMP, 
        5,
        '2024-01-20 14:20:00'::TIMESTAMP, 
        NULL, 
        NULL, 
        NULL, 
        'active'
    ),
    (
        'project-002', 
        '财务监控大屏', 
        '实时监控财务指标的大屏展示工程', 
        'public',
        'user-001', 
        '2024-01-10 09:15:00'::TIMESTAMP, 
        '2024-01-18 16:45:00'::TIMESTAMP, 
        3,
        '2024-01-18 16:45:00'::TIMESTAMP, 
        NULL, 
        NULL, 
        NULL, 
        'active'
    ),
    (
        'project-003', 
        '用户行为分析', 
        '分析用户行为数据的报表工程', 
        'private',
        'user-001', 
        '2024-01-05 11:00:00'::TIMESTAMP, 
        '2024-01-15 10:30:00'::TIMESTAMP, 
        8,
        '2024-01-15 10:30:00'::TIMESTAMP, 
        NULL, 
        NULL, 
        NULL, 
        'active'
    )
ON CONFLICT (project_id) DO UPDATE
SET
    project_name = EXCLUDED.project_name,
    description = EXCLUDED.description,
    project_type = EXCLUDED.project_type,
    update_time = EXCLUDED.update_time,
    report_count = EXCLUDED.report_count,
    last_report_update_time = EXCLUDED.last_report_update_time,
    status = EXCLUDED.status;

-- 插入报表数据（基于frontend/src/services/mockData.ts中的mockProjectReports）
INSERT INTO report (
    report_id,
    project_id,
    report_name,
    description,
    status,
    template,
    tags,
    created_time,
    update_time,
    created_by,
    last_edited_by
) VALUES
    (
        'report-001',
        'project-001',
        '销售额趋势分析',
        '监控核心品类的销售额同比与环比走势',
        'draft',
        '多轴折线图',
        '["销售", "趋势"]',
        '2024-01-12 09:00:00'::TIMESTAMP,
        '2024-01-20 12:40:00'::TIMESTAMP,
        'user-001',
        'user-001'
    ),
    (
        'report-002',
        'project-001',
        '渠道绩效对比',
        '对比线上线下渠道的成交额、客单价与转化',
        'published',
        '对比大屏',
        '["渠道", "对比"]',
        '2024-01-10 17:30:00'::TIMESTAMP,
        '2024-01-18 15:10:00'::TIMESTAMP,
        'user-001',
        'user-001'
    ),
    (
        'report-101',
        'project-002',
        '财务健康监控',
        '实时监控现金流、毛利率与费用率',
        'published',
        '指标驾驶舱',
        '["财务"]',
        '2024-01-08 10:00:00'::TIMESTAMP,
        '2024-01-18 11:05:00'::TIMESTAMP,
        'user-001',
        'user-001'
    )
ON CONFLICT (report_id) DO UPDATE
SET
    report_name = EXCLUDED.report_name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    template = EXCLUDED.template,
    tags = EXCLUDED.tags,
    update_time = EXCLUDED.update_time,
    last_edited_by = EXCLUDED.last_edited_by;

