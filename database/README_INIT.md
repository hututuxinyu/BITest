# 数据库初始化脚本执行指南

## 数据库连接信息

根据 `backend/src/main/resources/application.yml` 配置：
- **数据库名**: `biservice`
- **用户名**: `postgres`
- **密码**: `1234`
- **主机**: `localhost`
- **端口**: `5432`

## 执行方式

### 方式1：使用 psql 命令行工具（推荐）

#### Windows PowerShell/CMD:
```bash
# 切换到项目根目录
cd D:\Code\BIService

# 执行SQL脚本
psql -h localhost -p 5432 -U postgres -d biservice -f database/init.sql
```

#### Linux/Mac:
```bash
# 切换到项目根目录
cd /path/to/BIService

# 执行SQL脚本
psql -h localhost -p 5432 -U postgres -d biservice -f database/init.sql
```

**注意**: 执行时会提示输入密码，输入 `1234`

### 方式2：使用 psql 交互式执行

```bash
# 连接到数据库
psql -h localhost -p 5432 -U postgres -d biservice

# 在psql命令行中执行
\i database/init.sql

# 或者直接粘贴SQL内容执行
```

### 方式3：使用环境变量避免密码提示

#### Windows PowerShell:
```powershell
# 设置密码和编码
$env:PGPASSWORD="1234"
$env:PGCLIENTENCODING="UTF8"
psql -h localhost -p 5432 -U postgres -d biservice -f database/init.sql
```

#### Linux/Mac:
```bash
export PGPASSWORD=1234
export PGCLIENTENCODING=UTF8
psql -h localhost -p 5432 -U postgres -d biservice -f database/init.sql
```

### 方式4：使用 pgAdmin 图形界面

1. 打开 pgAdmin
2. 连接到 PostgreSQL 服务器
3. 展开数据库 `biservice`
4. 右键点击数据库 → **Query Tool**
5. 打开 `database/init.sql` 文件
6. 点击 **Execute** (F5) 执行脚本

### 方式5：使用 DBeaver 或其他数据库工具

1. 连接到 PostgreSQL 数据库
2. 选择数据库 `biservice`
3. 打开 SQL 编辑器
4. 加载 `database/init.sql` 文件
5. 执行脚本

### 方式6：通过 Spring Boot 应用自动执行（需要配置）

如果需要应用启动时自动执行，可以在 `application.yml` 中添加：

```yaml
spring:
  sql:
    init:
      mode: always
      data-locations: classpath:database/init.sql
      continue-on-error: true
```

## 验证数据

执行完成后，可以运行以下SQL验证数据：

```sql
-- 查询用户数量
SELECT COUNT(*) as user_count FROM "user";

-- 查询工程数量
SELECT COUNT(*) as project_count FROM project;

-- 查询报表数量
SELECT COUNT(*) as report_count FROM report;

-- 查询每个工程的报表数量
SELECT p.project_name, COUNT(r.report_id) as report_count 
FROM project p 
LEFT JOIN report r ON p.project_id = r.project_id 
GROUP BY p.project_id, p.project_name 
ORDER BY p.project_name;

-- 查看所有用户
SELECT user_id, username, email, status FROM "user";

-- 查看所有工程
SELECT project_id, project_name, user_id, report_count FROM project;

-- 查看所有报表
SELECT report_id, report_name, report_type, project_id, status FROM report;
```

## 常见问题

### 1. 编码错误：character with byte sequence 0x80 0xe5 in encoding "GBK" has no equivalent in encoding "UTF8"

**问题原因**: SQL文件可能是GBK编码，但PostgreSQL需要UTF-8编码。

**解决方案**:

#### 方案A：在psql命令中指定客户端编码（推荐）
```bash
# Windows PowerShell
$env:PGCLIENTENCODING="UTF8"
psql -h localhost -p 5432 -U postgres -d biservice -f database/init.sql

# Linux/Mac
export PGCLIENTENCODING=UTF8
psql -h localhost -p 5432 -U postgres -d biservice -f database/init.sql
```

#### 方案B：使用psql的编码参数
```bash
psql -h localhost -p 5432 -U postgres -d biservice --set=client_encoding=UTF8 -f database/init.sql
```

#### 方案C：在psql连接后设置编码
```bash
# 连接到数据库
psql -h localhost -p 5432 -U postgres -d biservice

# 设置客户端编码
SET client_encoding TO 'UTF8';

# 执行脚本
\i database/init.sql
```

#### 方案D：将文件转换为UTF-8编码（Windows）
使用PowerShell转换文件编码：
```powershell
# 读取GBK编码文件并保存为UTF-8
$content = Get-Content database/init.sql -Encoding Default
$content | Out-File -FilePath database/init_utf8.sql -Encoding UTF8

# 然后执行UTF-8版本
psql -h localhost -p 5432 -U postgres -d biservice -f database/init_utf8.sql
```

#### 方案E：使用文本编辑器重新保存为UTF-8
1. 用VS Code或Notepad++打开 `database/init.sql`
2. 在VS Code中：点击右下角编码 → "通过编码重新打开" → 选择 "GBK" → 然后 "通过编码保存" → 选择 "UTF-8"
3. 在Notepad++中：编码 → 转为UTF-8编码 → 保存

### 2. 找不到 psql 命令
- **Windows**: 需要安装 PostgreSQL 并添加到 PATH 环境变量
- **Linux**: `sudo apt-get install postgresql-client` (Ubuntu/Debian)
- **Mac**: `brew install postgresql`

### 3. 数据库不存在
先创建数据库：
```bash
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE biservice;"
```

### 4. 权限不足
确保用户 `postgres` 有足够的权限创建表和插入数据。

### 5. 表已存在错误
脚本使用了 `CREATE TABLE IF NOT EXISTS`，不会报错。如果数据已存在，使用 `ON CONFLICT DO NOTHING` 避免重复插入。

## 重置数据库（可选）

如果需要清空并重新初始化：

```sql
-- 注意：这会删除所有数据！
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS project CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
```

然后重新执行 `init.sql` 脚本。

