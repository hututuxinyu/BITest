-- BI Service Database Initialization Script
-- Created: 2025-11-29
-- Description: Initialize user, project, report tables and test data
-- Encoding: UTF-8

-- ============================================
-- 1. User Table
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
-- 2. Project Table
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
-- 3. Report Table
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
-- 3.1 Template Table
-- ============================================
CREATE TABLE IF NOT EXISTS template (
    template_id VARCHAR(64) PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    category VARCHAR(20),
    schema_file VARCHAR(500),
    preview_image VARCHAR(500),
    version VARCHAR(50),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_template_category ON template(category);
CREATE INDEX idx_template_create_time ON template(create_time);

-- ============================================
-- 4. Initialize Test Data
-- ============================================

-- 4.1 Insert Test Users
-- Password Notes:
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

-- 4.2 Insert Test Projects
INSERT INTO project (project_id, project_name, description, user_id, create_time, update_time, report_count) 
VALUES 
    ('project-001', 'Sales Data Analysis', 'BI report project for sales data analysis', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 3),
    ('project-002', 'Financial Report System', 'Enterprise financial data analysis and report generation', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 2),
    ('project-003', 'Operations Monitoring Dashboard', 'Real-time operations data monitoring and visualization', 'user-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
    ('project-004', 'Customer Analysis Report', 'Customer behavior analysis and profiling reports', 'user-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    ('project-005', 'Inventory Management System', 'Inventory data statistics and analysis reports', 'user-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
ON CONFLICT (project_id) DO NOTHING;

-- 4.3 Insert Test Reports
-- Note: schema_file path uses relative path, relative to schema.storage.path config (default: ./schema-storage)
INSERT INTO report (report_id, report_name, report_type, project_id, schema_file, version, status, creator_id, create_time, update_time) 
VALUES 
    -- Reports for project-001
    ('report-001', 'Monthly Sales Report', 'report', 'project-001', './schema-storage/report-001_a1b2c3d4.json', '1.0.0', 'published', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('report-002', 'Sales Trend Analysis', 'dashboard', 'project-001', './schema-storage/report-002_e5f6g7h8.json', '1.0.0', 'published', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('report-003', 'Regional Sales Comparison', 'report', 'project-001', './schema-storage/report-003_i9j0k1l2.json', '1.0.0', 'draft', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Reports for project-002
    ('report-004', 'Financial Report Summary', 'report', 'project-002', './schema-storage/report-004_m3n4o5p6.json', '1.0.0', 'published', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('report-005', 'Cost Analysis Report', 'report', 'project-002', './schema-storage/report-005_q7r8s9t0.json', '1.0.0', 'draft', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Reports for project-003
    ('report-006', 'Operations Real-time Monitoring', 'dashboard', 'project-003', './schema-storage/report-006_u1v2w3x4.json', '1.0.0', 'published', 'user-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Reports for project-005
    ('report-007', 'Inventory Statistics Report', 'report', 'project-005', './schema-storage/report-007_y5z6a7b8.json', '1.0.0', 'published', 'user-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (report_id) DO NOTHING;

-- 4.4 Insert Test Templates
-- Note: schema_file path uses relative path, points to backend/schema-storage/report-001_a1b2c3d4.json
INSERT INTO template (template_id, template_name, category, schema_file, preview_image, version, create_time) 
VALUES 
    ('template-001', 'Template 1', 'dashboard', './report-001_a1b2c3d4.json', '', '1.0.0', CURRENT_TIMESTAMP)
ON CONFLICT (template_id) DO NOTHING;

-- ============================================
-- 5. Data Validation Queries (Optional, for data verification)
-- ============================================

-- Query user count
-- SELECT COUNT(*) as user_count FROM "user";

-- Query project count
-- SELECT COUNT(*) as project_count FROM project;

-- Query report count
-- SELECT COUNT(*) as report_count FROM report;

-- Query report count per project
-- SELECT p.project_name, COUNT(r.report_id) as report_count 
-- FROM project p 
-- LEFT JOIN report r ON p.project_id = r.project_id 
-- GROUP BY p.project_id, p.project_name 
-- ORDER BY p.project_name;

-- ============================================
-- Initialization Complete
-- ============================================
