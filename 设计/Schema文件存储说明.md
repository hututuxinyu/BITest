# Schema文件存储说明

## 一、存储方式概述

### 当前实现方式
根据现有代码实现，Schema文件采用**文件系统存储 + 数据库路径索引**的方式：

1. **文件系统存储**：Schema文件内容存储在服务器本地文件系统中
2. **数据库路径索引**：PostgreSQL的`report`表中存储Schema文件的**路径**（`schema_file`字段），而不是文件内容

### 设计文档中的说明
设计文档中提到了两种存储方式：
- **方式1**：使用PostgreSQL的BYTEA或JSONB类型直接存储文件内容
- **方式2**：使用文件系统存储，数据库中存储文件路径

**当前实现采用的是方式2**。

---

## 二、存储位置

### 1. 文件系统存储路径

**配置位置**：`backend/src/main/resources/application.yml`

```yaml
schema:
  storage:
    path: ./schema-storage  # 默认路径，可配置
    type: database          # 存储类型（实际是文件系统存储）
```

**默认存储路径**：`./schema-storage/`（相对于应用运行目录）

**文件命名规则**：`{reportId}_{hash前8位}.json`

**示例**：
- 报表ID: `report-001`
- Hash值: `a1b2c3d4e5f6...`
- 文件路径: `./schema-storage/report-001_a1b2c3d4.json`

### 2. 数据库存储

**表名**：`report`

**字段**：`schema_file` (VARCHAR(500))

**存储内容**：Schema文件的**完整路径**（绝对路径或相对路径）

**示例**：
```sql
UPDATE report 
SET schema_file = './schema-storage/report-001_a1b2c3d4.json'
WHERE report_id = 'report-001';
```

---

## 三、存储流程

### 1. 保存Schema流程

```mermaid
graph LR
    A[用户保存Schema] --> B[SchemaService.saveSchema]
    B --> C[验证Schema格式]
    C --> D[计算Hash值]
    D --> E[生成文件路径]
    E --> F[保存到文件系统]
    F --> G[更新数据库schema_file字段]
    G --> H[保存完成]
```

**代码实现**（`SchemaService.saveToDatabase()`）：
```java
// 1. 生成文件路径
String fileName = report.getReportId() + "_" + hash.substring(0, 8) + ".json";
Path filePath = Paths.get(schemaStoragePath, fileName);

// 2. 确保目录存在
Files.createDirectories(filePath.getParent());

// 3. 保存到文件系统
Files.write(filePath, schemaJson.getBytes(StandardCharsets.UTF_8));

// 4. 更新数据库中的文件路径
report.setSchemaFile(filePath.toString());
reportRepository.save(report);
```

### 2. 读取Schema流程

```mermaid
graph LR
    A[读取Schema请求] --> B[SchemaService.readSchema]
    B --> C[从数据库获取文件路径]
    C --> D[检查文件是否存在]
    D --> E[从文件系统读取内容]
    E --> F[返回Schema JSON]
```

**代码实现**（`SchemaService.readFromFileSystem()`）：
```java
// 1. 从数据库获取文件路径
Report report = reportRepository.findById(reportId).get();
String filePath = report.getSchemaFile();

// 2. 从文件系统读取
Path path = Paths.get(filePath);
if (!Files.exists(path)) {
    throw new RuntimeException("Schema文件不存在: " + filePath);
}
return new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
```

---

## 四、Codehub集成

### Schema不是直接从Codehub加载的

**工作流程**：

1. **导入阶段**：
   - 用户从Codehub个人分支导入Schema文件
   - 系统从Codehub下载Schema文件内容
   - 下载后保存到本地文件系统
   - 更新数据库中的文件路径

2. **日常使用**：
   - Schema文件存储在本地文件系统
   - 读取时从本地文件系统读取，**不是**从Codehub实时加载

3. **提交到Codehub**：
   - 用户修改Schema后，可以选择提交到Codehub
   - 系统读取本地文件系统的Schema内容
   - 提交到Codehub个人分支

### Codehub集成流程图

```
┌─────────────────┐
│  用户操作       │
└────────┬────────┘
         │
         ├─→ 从Codehub导入
         │   ├─→ 从Codehub下载文件
         │   ├─→ 保存到本地文件系统
         │   └─→ 更新数据库路径
         │
         ├─→ 编辑Schema
         │   ├─→ 从本地文件系统读取
         │   ├─→ 用户编辑
         │   └─→ 保存到本地文件系统
         │
         └─→ 提交到Codehub
             ├─→ 从本地文件系统读取
             └─→ 提交到Codehub个人分支
```

---

## 五、存储方式对比

### 方式1：文件系统存储（当前实现）

**优点**：
- ✅ 文件系统读写性能好
- ✅ 不占用数据库存储空间
- ✅ 便于文件管理和备份
- ✅ 支持大文件存储
- ✅ 便于版本管理（通过文件系统工具）

**缺点**：
- ❌ 需要管理文件系统路径
- ❌ 文件系统故障可能导致数据丢失
- ❌ 需要处理文件权限问题
- ❌ 分布式部署时需要考虑文件共享

### 方式2：数据库存储（设计文档中提到）

**优点**：
- ✅ 数据集中管理
- ✅ 事务一致性保证
- ✅ 便于备份和恢复
- ✅ 分布式部署友好

**缺点**：
- ❌ 占用数据库存储空间
- ❌ 大文件可能影响数据库性能
- ❌ 需要使用BYTEA或JSONB类型

---

## 六、当前实现细节

### 1. 文件存储位置

**配置项**：`schema.storage.path`
- 默认值：`./schema-storage`
- 可配置为绝对路径或相对路径
- 建议使用绝对路径，避免路径问题

**目录结构**：
```
schema-storage/
├── report-001_a1b2c3d4.json
├── report-002_e5f6g7h8.json
├── report-003_i9j0k1l2.json
└── ...
```

### 2. 数据库字段

**表结构**：
```sql
CREATE TABLE report (
    report_id VARCHAR(64) PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    schema_file VARCHAR(500),  -- 存储文件路径
    ...
);
```

**字段说明**：
- `schema_file`：存储Schema文件的完整路径
- 路径格式：可以是绝对路径或相对路径
- 当前实现：使用绝对路径（`filePath.toString()`）

### 3. 文件命名规则

**格式**：`{reportId}_{hash前8位}.json`

**示例**：
- 报表ID: `report-001`
- Hash值: `a1b2c3d4e5f6g7h8...`
- 文件名: `report-001_a1b2c3d4.json`

**优点**：
- 文件名包含报表ID，便于识别
- Hash值确保文件唯一性
- 支持版本管理（不同版本生成不同Hash）

---

## 七、配置建议

### 1. 生产环境配置

**application.yml**：
```yaml
schema:
  storage:
    path: /data/biservice/schema-storage  # 使用绝对路径
    type: database  # 虽然叫database，但实际是文件系统存储
```

### 2. 目录权限

确保应用有读写权限：
```bash
mkdir -p /data/biservice/schema-storage
chmod 755 /data/biservice/schema-storage
chown app-user:app-group /data/biservice/schema-storage
```

### 3. 备份策略

**文件系统备份**：
- 定期备份`schema-storage`目录
- 建议使用rsync或tar进行备份

**数据库备份**：
- 备份`report`表，确保文件路径信息不丢失
- 文件路径和文件内容需要同时备份

---

## 八、常见问题

### Q1: Schema文件存储在哪里？
**A**: Schema文件存储在服务器本地文件系统中，路径由`schema.storage.path`配置项指定，默认为`./schema-storage/`。

### Q2: PostgreSQL中存储的是什么？
**A**: PostgreSQL的`report`表中存储的是Schema文件的**路径**（`schema_file`字段），不是文件内容。

### Q3: Schema是从Codehub直接加载的吗？
**A**: 不是。Schema文件存储在本地文件系统中：
- **导入时**：从Codehub下载到本地文件系统
- **使用时**：从本地文件系统读取
- **提交时**：从本地文件系统读取后提交到Codehub

### Q4: 如何修改存储路径？
**A**: 修改`application.yml`中的`schema.storage.path`配置项，重启应用即可。

### Q5: 文件系统故障怎么办？
**A**: 
- 定期备份文件系统
- 考虑使用分布式文件系统（如NFS、Ceph等）
- 或者改为数据库存储方式（使用BYTEA或JSONB）

### Q6: 可以改为数据库存储吗？
**A**: 可以。需要：
1. 修改`report`表结构，添加`schema_content`字段（JSONB类型）
2. 修改`SchemaService`的保存和读取逻辑
3. 移除文件系统相关代码

---

## 九、改进建议

### 1. 支持多种存储方式

可以同时支持文件系统和数据库存储，通过配置选择：
```yaml
schema:
  storage:
    type: filesystem  # filesystem 或 database
    path: ./schema-storage  # 文件系统路径（type=filesystem时使用）
```

### 2. 支持对象存储

对于分布式部署，可以考虑支持对象存储（如MinIO、OSS等）：
```yaml
schema:
  storage:
    type: object-storage
    endpoint: http://minio:9000
    bucket: schema-files
```

### 3. 文件路径管理

当前使用绝对路径，建议：
- 使用相对路径，便于迁移
- 或者使用配置的存储根目录 + 相对路径

### 4. 文件清理机制

实现定期清理机制：
- 删除已删除报表对应的Schema文件
- 清理旧版本的Schema文件

---

## 十、总结

### 当前实现
- ✅ **存储位置**：本地文件系统（`./schema-storage/`）
- ✅ **数据库存储**：文件路径（`schema_file`字段）
- ✅ **文件命名**：`{reportId}_{hash前8位}.json`
- ✅ **Codehub集成**：导入时下载到本地，使用时从本地读取

### 关键点
1. **PostgreSQL存储的是文件路径，不是文件内容**
2. **Schema文件存储在本地文件系统中**
3. **Codehub只是导入/导出的渠道，不是实时数据源**
4. **文件路径存储在数据库的`schema_file`字段中**

---

**文档更新时间**: 2025-11-29

