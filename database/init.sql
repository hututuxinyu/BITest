-- BI系统数据库初始化脚本

-- 用户表
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

-- 工程表
CREATE TABLE IF NOT EXISTS project (
    project_id VARCHAR(64) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(20) NOT NULL DEFAULT 'private',
    user_id VARCHAR(64) NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    report_count INT DEFAULT 0,
    last_report_update_time TIMESTAMP,
    codehub_repository VARCHAR(255),
    codehub_branch VARCHAR(255),
    codehub_path VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    CONSTRAINT fk_project_user FOREIGN KEY (user_id) REFERENCES "user"(user_id)
);

CREATE INDEX idx_project_user_id ON project(user_id);
CREATE INDEX idx_project_create_time ON project(create_time);
CREATE INDEX idx_project_project_name ON project(project_name);
CREATE INDEX idx_project_status ON project(status);

-- 插入测试用户（密码：admin123，实际使用时应该使用BCrypt加密）
INSERT INTO "user" (user_id, username, email, password_hash, status) 
VALUES ('user-001', 'admin', 'admin@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iwK8pJ5aC', 'active')
ON CONFLICT (user_id) DO NOTHING;


