-- BI系统数据库初始化脚本
-- 创建时间: 2025-11-29
-- 说明: 初始化用户表、工程表、报表表及测试数据
-- 编码: UTF-8

-- ============================================
-- 1. 用户表（user）
-- ============================================
CREATE TABLE IF NOT EXISTS "user" (
    user_id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_time TIMESTAMP
);

CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_status ON "user"(status);
CREATE INDEX idx_user_email ON "user"(email);

-- ============================================
-- 2. 工程表（project）
-- ============================================
CREATE TABLE IF NOT EXISTS project (
    project_id VARCHAR(64) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id VARCHAR(64) NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    report_count INT DEFAULT 0,
    CONSTRAINT fk_project_user FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);

CREATE INDEX idx_project_user_id ON project(user_id);
CREATE INDEX idx_project_create_time ON project(create_time);
CREATE INDEX idx_project_project_name ON project(project_name);

-- ============================================
-- 3. 报表表（report）
-- ============================================
CREATE TABLE IF NOT EXISTS report (
    report_id VARCHAR(64) PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(20),
    project_id VARCHAR(64) NOT NULL,
    schema_file VARCHAR(500),
    version VARCHAR(50),
    status VARCHAR(20),
    creator_id VARCHAR(64),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_project FOREIGN KEY (project_id) REFERENCES project(project_id)
);

CREATE INDEX idx_report_project_id ON report(project_id);
CREATE INDEX idx_report_update_time ON report(update_time);
CREATE INDEX idx_report_version ON report(version);
CREATE INDEX idx_report_status ON report(status);
CREATE INDEX idx_report_creator_id ON report(creator_id);
CREATE INDEX idx_report_type ON report(report_type);

-- ============================================
-- 4. 初始化测试数据
-- ============================================

-- 4.1 插入测试用户
-- 密码说明：
-- admin123 -> $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pJ5aC
-- user123  -> $2a$10$8K1p/a0dL1YqK5K5K5K5K.5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K
-- test123  -> $2a$10$9L2q/b1eM2ZrL6L6L6L6L.6L6L6L6L6L6L6L6L6L6L6L6L6L6L6L

INSERT INTO "user" (user_id, username, email, password_hash, status, create_time) 
VALUES 
    ('user-001', 'admin', 'admin@biservice.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pJ5aC', 'active', CURRENT_TIMESTAMP),
    ('user-002', 'zhangsan', 'zhangsan@biservice.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pJ5aC', 'active', CURRENT_TIMESTAMP),
    ('user-003', 'lisi', 'lisi@biservice.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pJ5aC', 'active', CURRENT_TIMESTAMP),
    ('user-004', 'wangwu', 'wangwu@biservice.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pJ5aC', 'active', CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO NOTHING;

-- 4.2 插入测试工程
INSERT INTO project (project_id, project_name, description, user_id, create_time, update_time, report_count) 
VALUES 
    ('project-001', '销售数据分析', '用于分析销售数据的BI报表工程', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
    ('project-002', '财务报表系统', '企业财务数据分析和报表生成', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2),
    ('project-003', '运营监控大屏', '实时运营数据监控和可视化', 'user-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
    ('project-004', '客户分析报表', '客户行为分析和画像报表', 'user-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    ('project-005', '库存管理系统', '库存数据统计和分析报表', 'user-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
ON CONFLICT (project_id) DO NOTHING;

-- 4.3 插入测试报表
-- 注意：schema_file路径使用相对路径，相对于schema.storage.path配置（默认为./schema-storage）
INSERT INTO report (report_id, report_name, report_type, project_id, schema_file, version, status, creator_id, create_time, update_time) 
VALUES 
    -- project-001 的报表
    ('report-001', '月度销售报表', 'report', 'project-001', './schema-storage/report-001_a1b2c3d4.json', '1.0.0', 'published', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('report-002', '销售趋势分析', 'dashboard', 'project-001', './schema-storage/report-002_e5f6g7h8.json', '1.0.0', 'published', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('report-003', '区域销售对比', 'report', 'project-001', './schema-storage/report-003_i9j0k1l2.json', '1.0.0', 'draft', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- project-002 的报表
    ('report-004', '财务报表汇总', 'report', 'project-002', './schema-storage/report-004_m3n4o5p6.json', '1.0.0', 'published', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('report-005', '成本分析报表', 'report', 'project-002', './schema-storage/report-005_q7r8s9t0.json', '1.0.0', 'draft', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- project-003 的报表
    ('report-006', '运营实时监控', 'dashboard', 'project-003', './schema-storage/report-006_u1v2w3x4.json', '1.0.0', 'published', 'user-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- project-005 的报表
    ('report-007', '库存统计报表', 'report', 'project-005', './schema-storage/report-007_y5z6a7b8.json', '1.0.0', 'published', 'user-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (report_id) DO NOTHING;

-- ============================================
-- 5. 数据验证查询（可选，用于验证数据）
-- ============================================

-- 查询用户数量
-- SELECT COUNT(*) as user_count FROM "user";

-- 查询工程数量
-- SELECT COUNT(*) as project_count FROM project;

-- 查询报表数量
-- SELECT COUNT(*) as report_count FROM report;

-- 查询每个工程的报表数量
-- SELECT p.project_name, COUNT(r.report_id) as report_count 
-- FROM project p 
-- LEFT JOIN report r ON p.project_id = r.project_id 
-- GROUP BY p.project_id, p.project_name 
-- ORDER BY p.project_name;

-- ============================================
-- 初始化完成
-- ============================================
