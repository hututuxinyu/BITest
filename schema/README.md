# 报表Schema定义

本目录包含设计态与运行态之间的报表Schema标准定义文件。

## 文件说明

### 1. report-schema.json
JSON Schema定义文件，用于验证报表Schema格式的有效性。可以使用JSON Schema验证器（如ajv）来验证生成的Schema是否符合规范。

**使用示例：**
```javascript
const Ajv = require('ajv');
const ajv = new Ajv();
const schema = require('./report-schema.json');
const validate = ajv.compile(schema);

const reportSchema = { /* 报表Schema数据 */ };
const valid = validate(reportSchema);
if (!valid) {
  console.log(validate.errors);
}
```

### 2. report-schema.ts
TypeScript类型定义文件，用于开发时的类型检查和代码提示。

**使用示例：**
```typescript
import { ReportSchema, Component, Datasource } from './report-schema';

const report: ReportSchema = {
  version: '1.0.0',
  reportId: 'report-001',
  // ... 其他字段
};
```

### 3. example-report-schema.json
示例Schema文件，展示了一个完整的报表Schema结构，包含：
- 报表基本信息
- 画布配置
- 多个组件（柱状图、折线图、表格、筛选器、按钮）
- 数据源配置
- 交互配置
- 权限配置
- 国际化配置
- 样式配置

可以作为参考，了解如何构建完整的报表Schema。

## Schema结构说明

### 核心字段

- **version**: Schema版本号，遵循语义化版本规范（如：1.0.0）
- **reportId**: 报表唯一标识符
- **reportName**: 报表名称
- **reportType**: 报表类型（report-报表，dashboard-大屏）
- **metadata**: 报表元信息（创建时间、更新时间、创建者等）
- **canvas**: 画布配置（尺寸、背景、网格等）
- **components**: 组件列表（图表、表格、控制类组件等）
- **datasources**: 数据源配置列表
- **interactions**: 交互配置列表
- **i18n**: 国际化配置
- **style**: 样式配置

### 组件类型

支持的组件类型包括：
- **基础图表组件**: barChart（柱状图）、lineChart（折线图）、pieChart（饼图）、scatterChart（散点图）、radarChart（雷达图）、gaugeChart（仪表盘）等
- **表格组件**: table（表格）、treeTable（树形表格）等
- **多媒体组件**: image（图片）、video（视频）、text（文本）、richText（富文本）等
- **容器组件**: group（分组）、tabs（选项卡）等
- **控制类组件**: button（按钮）、filter（筛选器）、input（输入框）、switch（开关）、radio（单选框）、checkbox（多选框）等

### 数据源类型

支持的数据源类型：
- **关系型数据库**: mysql、postgresql、oracle
- **大数据存储**: hive、clickhouse、elasticsearch
- **API数据源**: api
- **文件数据源**: file（支持csv、excel、json）

### 交互类型

支持的交互类型：
- **drillDown**: 下钻，从当前数据维度钻取到更细粒度维度
- **associate**: 关联，将当前组件的筛选条件传递给其他组件
- **jump**: 跳转，跳转到其他报表或页面
- **filter**: 过滤，应用筛选条件，刷新数据
- **popup**: 弹窗，选择当前数据后，弹出新的报表页面
- **refresh**: 刷新，刷新目标组件的数据

### 事件类型

支持的事件类型：
- **click**: 点击事件
- **hover**: 悬停事件
- **select**: 选择事件
- **input**: 输入事件
- **change**: 值变更事件
- **search**: 搜索事件

### 国际化支持

Schema支持多语言配置，目前支持的语言：
- **zh-CN**: 简体中文
- **en-US**: 美式英语

可以在组件的`i18n`字段和报表的`i18n`字段中配置多语言文本。

## 版本管理

Schema版本号遵循语义化版本规范（Semantic Versioning）：
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

当Schema结构发生变更时，需要更新版本号，并确保运行态系统能够兼容处理不同版本的Schema。

## 使用流程

### 设计态生成Schema

1. 用户在设计态界面配置报表
2. 系统收集所有配置信息（组件、数据源、交互等）
3. 生成符合规范的Schema JSON
4. 使用JSON Schema验证器验证Schema有效性
5. 保存Schema到文件系统或对象存储

### 运行态解析Schema

1. 从文件系统或对象存储加载Schema文件
2. 验证Schema格式和版本
3. 解析Schema，构建运行时数据结构
4. 根据Schema渲染报表界面
5. 执行数据查询和交互逻辑

## 注意事项

1. **必填字段**: version、reportId、reportName、reportType、metadata、canvas、components为必填字段
2. **组件ID唯一性**: 所有组件的componentId必须唯一
3. **数据源ID引用**: 组件中引用的datasourceId必须在datasources中存在
4. **交互目标引用**: 交互配置中的target必须引用有效的组件ID或报表ID
5. **参数来源**: 当参数source为control时，sourceId必须引用有效的控制类组件ID
6. **权限配置**: 权限配置中的userId和roleId至少需要指定一个
7. **日期格式**: 所有日期时间字段使用ISO 8601格式（如：2024-01-15T10:30:00Z）

## 扩展性

Schema设计支持扩展：
- 组件props字段可以包含任意属性，具体属性根据组件类型而定
- 数据源connectionConfig和queryConfig可以根据数据源类型扩展
- 交互action的config字段可以根据actionType扩展
- 样式配置支持任意CSS属性

## 相关文档

- [设计态系统设计说明书](../设计/设计态系统设计说明书.md)
- [运行态系统设计说明书](../设计/运行态系统设计说明书.md)
- [系统设计说明书](../设计/系统设计说明书.md)

