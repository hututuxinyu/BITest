# Schema文件存储目录

## 说明

此目录用于存储报表的Schema文件。每个报表对应一个JSON格式的Schema文件。

## 文件命名规则

文件命名格式：`{reportId}_{hash前8位}.json`

示例：
- `report-001_a1b2c3d4.json` - 报表ID为report-001的Schema文件
- `report-002_e5f6g7h8.json` - 报表ID为report-002的Schema文件

## 当前测试文件

| 文件名 | 报表ID | 报表名称 | 状态 |
|--------|--------|---------|------|
| report-001_a1b2c3d4.json | report-001 | 月度销售报表 | published |
| report-002_e5f6g7h8.json | report-002 | 销售趋势分析 | published |
| report-003_i9j0k1l2.json | report-003 | 区域销售对比 | draft |
| report-004_m3n4o5p6.json | report-004 | 财务报表汇总 | published |
| report-005_q7r8s9t0.json | report-005 | 成本分析报表 | draft |
| report-006_u1v2w3x4.json | report-006 | 运营实时监控 | published |
| report-007_y5z6a7b8.json | report-007 | 库存统计报表 | published |

## 测试发布功能

推荐使用以下报表测试发布功能（当前状态为draft）：
- **report-003**: 区域销售对比
- **report-005**: 成本分析报表

## Schema文件格式

所有Schema文件都符合标准的报表Schema格式，包含以下主要字段：
- `version`: Schema版本号
- `reportId`: 报表ID
- `reportName`: 报表名称
- `reportType`: 报表类型（report/dashboard）
- `metadata`: 报表元信息
- `canvas`: 画布配置
- `components`: 组件列表
- `datasources`: 数据源配置
- `interactions`: 交互配置
- `i18n`: 国际化配置

## 注意事项

1. 此目录中的文件由系统自动管理，请勿手动删除
2. 文件路径存储在PostgreSQL数据库的`report`表的`schema_file`字段中
3. 如果文件被删除，需要重新生成或从备份恢复
4. 生产环境建议定期备份此目录

## 生成方式

可以通过以下方式生成Schema文件：

1. **Shell脚本**（Linux/Mac）：
   ```bash
   ./database/seed_schema_files.sh
   ```

2. **PowerShell脚本**（Windows）：
   ```powershell
   .\database\seed_schema_files.ps1
   ```

3. **Java工具**：
   ```bash
   java -Dschema.test.auto-generate=true -jar target/biservice.jar
   ```

4. **手动创建**：参考示例文件格式手动创建

---

**最后更新**: 2025-11-29

