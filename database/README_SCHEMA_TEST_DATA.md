# Schema测试数据生成说明

## 概述

为了测试报表发布功能，需要为测试报表创建真实的Schema文件。本文档说明如何生成和管理Schema测试数据。

## 存储方式

- **文件系统**：Schema文件存储在 `./schema-storage/` 目录（可配置）
- **数据库**：`report` 表中的 `schema_file` 字段存储文件路径

## 生成方式

### 方式1：使用Shell脚本（Linux/Mac）

```bash
# 1. 给脚本添加执行权限
chmod +x database/seed_schema_files.sh

# 2. 执行脚本生成Schema文件
./database/seed_schema_files.sh

# 3. 更新数据库中的文件路径
psql -U postgres -d biservice -f database/seed_schema_test_data.sql
```

### 方式2：使用PowerShell脚本（Windows）

```powershell
# 1. 执行脚本生成Schema文件
.\database\seed_schema_files.ps1

# 2. 更新数据库中的文件路径
psql -U postgres -d biservice -f database\seed_schema_test_data.sql
```

### 方式3：使用Java工具（推荐）

```bash
# 1. 编译项目
mvn clean compile

# 2. 运行应用时启用自动生成
java -Dschema.test.auto-generate=true -jar target/biservice.jar

# 或者手动调用
# 在应用启动后，调用 SchemaTestDataGenerator.generateTestSchemas() 方法
```

### 方式4：手动创建

1. 创建 `schema-storage` 目录
2. 为每个报表创建对应的Schema JSON文件
3. 文件命名格式：`{reportId}_{hash前8位}.json`
4. 更新数据库中的 `schema_file` 字段

## 测试数据说明

### 已包含的测试报表

| 报表ID | 报表名称 | 状态 | 用途 |
|--------|---------|------|------|
| report-001 | 月度销售报表 | published | 已发布报表示例 |
| report-002 | 销售趋势分析 | published | 已发布仪表盘示例 |
| report-003 | 区域销售对比 | draft | **测试发布功能** |
| report-004 | 财务报表汇总 | published | 已发布报表示例 |
| report-005 | 成本分析报表 | draft | **测试发布功能** |
| report-006 | 运营实时监控 | published | 已发布仪表盘示例 |
| report-007 | 库存统计报表 | published | 已发布报表示例 |

### 测试发布功能

推荐使用以下报表测试发布功能：
- **report-003**：区域销售对比（草稿状态）
- **report-005**：成本分析报表（草稿状态）

这两个报表当前状态为 `draft`，可以测试发布功能。

## Schema文件格式

生成的Schema文件符合以下格式：

```json
{
  "version": "1.0.0",
  "reportId": "report-001",
  "reportName": "报表名称",
  "reportType": "report",
  "metadata": {
    "createTime": "2024-01-15T10:30:00Z",
    "updateTime": "2024-01-20T14:20:00Z",
    "creator": "user-001",
    "description": "报表描述"
  },
  "canvas": {
    "width": 1920,
    "height": 1080,
    "backgroundColor": "#f5f5f5",
    "grid": true,
    "gridSize": 10
  },
  "components": [
    {
      "componentId": "comp-001",
      "componentType": "barChart",
      "componentName": "数据图表",
      "position": { "x": 100, "y": 100 },
      "size": { "width": 600, "height": 400 },
      "zIndex": 1,
      "visible": true,
      "locked": false,
      "props": {
        "title": "数据展示",
        "xAxisField": "category",
        "yAxisField": "value",
        "color": "#1890ff",
        "showLegend": true,
        "showTooltip": true
      },
      "datasourceConfig": {
        "sourceType": "static",
        "bindingType": "static",
        "staticConfig": {
          "data": [
            {"category": "类别1", "value": 100},
            {"category": "类别2", "value": 200},
            {"category": "类别3", "value": 150}
          ]
        }
      },
      "interactions": []
    }
  ],
  "datasources": [],
  "interactions": [],
  "i18n": {}
}
```

## 验证Schema文件

### 1. 检查文件是否存在

```bash
# Linux/Mac
ls -la schema-storage/

# Windows
dir schema-storage
```

### 2. 验证文件格式

```bash
# 使用jq验证JSON格式（如果安装了jq）
jq . schema-storage/report-001_*.json

# 或使用Python
python -m json.tool schema-storage/report-001_*.json
```

### 3. 验证数据库路径

```sql
SELECT 
    report_id,
    report_name,
    status,
    schema_file,
    CASE 
        WHEN schema_file IS NULL THEN '❌ 缺少Schema文件路径'
        WHEN schema_file LIKE '%.json' THEN '✅ Schema文件路径已设置'
        ELSE '⚠️ Schema文件路径格式异常'
    END AS status_check
FROM report
ORDER BY report_id;
```

### 4. 验证文件可读性

```bash
# 测试读取Schema文件
curl http://localhost:8080/api/reports/project/project-001/report-001/schema/validate
```

## 常见问题

### Q1: Schema文件生成后，数据库路径不匹配？

**A**: 确保执行了 `seed_schema_test_data.sql` 脚本更新数据库路径。

### Q2: 文件路径是相对路径还是绝对路径？

**A**: 当前实现使用绝对路径。如果使用相对路径，需要确保应用运行目录正确。

### Q3: 如何修改存储路径？

**A**: 修改 `application.yml` 中的 `schema.storage.path` 配置项。

### Q4: Schema文件验证失败？

**A**: 
1. 检查JSON格式是否正确
2. 检查是否包含必需的字段（version, reportId, reportName等）
3. 查看应用日志获取详细错误信息

### Q5: 如何为新的报表生成Schema？

**A**: 
1. 在数据库中创建报表记录
2. 运行 `SchemaTestDataGenerator.generateSchemaForReport(report)` 方法
3. 或手动创建Schema文件并更新数据库路径

## 清理测试数据

如果需要清理测试数据：

```bash
# 删除Schema文件
rm -rf schema-storage/

# 清空数据库中的schema_file路径
psql -U postgres -d biservice -c "UPDATE report SET schema_file = NULL;"
```

## 注意事项

1. **文件权限**：确保应用有读写 `schema-storage` 目录的权限
2. **路径一致性**：确保数据库中的路径与实际文件路径一致
3. **备份**：测试前建议备份数据库和文件系统
4. **Hash值**：实际生产环境中，Hash值会根据Schema内容计算，测试数据使用固定Hash前缀

---

**文档更新时间**: 2025-11-29

