# Datasources Schema 格式说明

## 概述
新的 datasources schema 格式基于前端的数据集（Dataset）和字段选择机制。datasources 定义共享的数据源配置，包含数据集信息和过滤条件。图表类组件通过 X 轴和 Y 轴字段来确定数据，这些字段选择在组件级别的 `datasourceConfig` 中配置。

## 基本结构

```json
{
  "datasources": [
    {
      "datasourceId": "ds-001",
      "datasourceName": "销售数据库",
      "datasourceType": "mysql",
      "datasetId": "dataset-001",
      "datasetName": "销售数据集",
      "queryConfig": {
        "selectedFields": [
          {
            "fieldName": "date",
            "fieldLabel": "日期",
            "fieldType": "date",
            "tag": "dimension"
          },
          {
            "fieldName": "amount",
            "fieldLabel": "销售额",
            "fieldType": "number",
            "tag": "measure"
          }
        ]
      },
      "filters": [
        {
          "field": "date",
          "operator": "between",
          "source": "control",
          "sourceId": "comp-004",
          "valuePath": "value"
        }
      ],
      "parameters": {
        "startDate": {
          "type": "date",
          "source": "control",
          "sourceId": "comp-004",
          "path": "value[0]"
        },
        "endDate": {
          "type": "date",
          "source": "control",
          "sourceId": "comp-004",
          "path": "value[1]"
        }
      }
    }
  ]
}
```

## 组件级别的数据绑定配置

组件通过 `datasourceConfig` 配置具体的数据绑定：

```json
{
  "componentId": "comp-001",
  "componentType": "barChart",
  "datasourceId": "ds-001",
  "datasourceConfig": {
    "sourceType": "dataset",
    "bindingType": "dataset",
    "datasetConfig": {
      "datasetId": "dataset-001",
      "datasourceId": "ds-001",
      "xAxisField": "month",
      "yAxisField": "amount"
    }
  }
}
```

## 字段说明

### datasources 顶层字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `datasourceId` | string | 是 | 数据源唯一标识 |
| `datasourceName` | string | 是 | 数据源名称 |
| `datasourceType` | string | 是 | 数据源类型（mysql, postgresql, oracle等） |
| `datasetId` | string | 是 | 关联的数据集ID |
| `datasetName` | string | 否 | 数据集名称（用于显示） |
| `queryConfig` | object | 是 | 查询配置，包含选择的字段列表 |
| `filters` | array | 否 | 过滤条件列表（应用于所有使用该数据源的组件） |
| `parameters` | object | 否 | 参数配置（用于动态参数绑定） |

### queryConfig 字段（查询配置）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `selectedFields` | array | 是 | 选择的字段列表，明确指定要查询的字段 |

### selectedFields 字段项

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `fieldName` | string | 是 | 字段名称（数据库字段名） |
| `fieldLabel` | string | 是 | 字段显示标签 |
| `fieldType` | string | 是 | 字段类型（string, number, date, boolean） |
| `tag` | string | 是 | 字段标签（dimension-维度, measure-度量） |

**注意**：
- `queryConfig.selectedFields` 定义了数据源要查询的所有字段
- 图表的具体字段选择（xAxisField, yAxisField）在组件级别的 `datasourceConfig.datasetConfig` 中配置，这些字段必须来自 `selectedFields`

### filters 字段（过滤条件）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `field` | string | 是 | 字段名 |
| `operator` | string | 是 | 操作符（eq, ne, gt, gte, lt, lte, between, in, like等） |
| `value` | any | 否 | 过滤值（当source为static时使用） |
| `source` | string | 否 | 值来源：`control`-控制类组件，`static`-静态值 |
| `sourceId` | string | 否 | 来源组件ID（当source为control时必填） |
| `valuePath` | string | 否 | JSON路径（用于从控制组件的值中提取，如 "value"） |

**source 字段说明**：
- `control`：值来源于控制类组件（如日期选择器、下拉框、输入框等），需要配合 `sourceId` 指定具体的组件ID
- `static`：静态值，直接使用 `value` 字段的值

### parameters 字段（参数配置）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 参数类型（string, number, date, boolean） |
| `source` | string | 是 | 值来源：`control`-控制类组件，`static`-静态值，`url`-URL参数，`user`-用户信息 |
| `sourceId` | string | 否 | 来源组件ID（当source为control时必填） |
| `path` | string | 否 | JSON路径（用于从复杂对象中提取值，如 "value[0]" 表示数组的第一个元素） |
| `defaultValue` | any | 否 | 默认值（当source为static时使用） |

**source 字段说明**：
- `control`：值来源于控制类组件（如日期选择器、下拉框、输入框等），需要配合 `sourceId` 指定具体的组件ID，使用 `path` 提取值
- `static`：静态值，直接使用 `defaultValue` 字段的值
- `url`：值来源于URL查询参数
- `user`：值来源于当前用户信息（如用户ID、用户名等）

## 使用场景

### 1. 图表类组件（柱状图、折线图等）

**datasources 配置**：
```json
{
  "datasourceId": "ds-001",
  "datasourceName": "销售数据库",
  "datasourceType": "mysql",
  "datasetId": "dataset-001",
  "datasetName": "销售数据集",
  "queryConfig": {
    "selectedFields": [
      {
        "fieldName": "date",
        "fieldLabel": "日期",
        "fieldType": "date",
        "tag": "dimension"
      },
      {
        "fieldName": "amount",
        "fieldLabel": "销售额",
        "fieldType": "number",
        "tag": "measure"
      }
    ]
  }
}
```

**组件配置**（在组件的 datasourceConfig 中）：
```json
{
  "componentId": "comp-001",
  "componentType": "barChart",
  "datasourceId": "ds-001",
  "datasourceConfig": {
    "sourceType": "dataset",
    "bindingType": "dataset",
    "datasetConfig": {
      "datasetId": "dataset-001",
      "datasourceId": "ds-001",
      "xAxisField": "month",
      "yAxisField": "amount"
    }
  }
}
```

### 2. 表格组件

**datasources 配置**：
```json
{
  "datasourceId": "ds-001",
  "datasourceName": "销售数据库",
  "datasourceType": "mysql",
  "datasetId": "dataset-001",
  "datasetName": "销售数据集",
  "queryConfig": {
    "selectedFields": [
      {
        "fieldName": "date",
        "fieldLabel": "日期",
        "fieldType": "date",
        "tag": "dimension"
      },
      {
        "fieldName": "product",
        "fieldLabel": "产品",
        "fieldType": "string",
        "tag": "dimension"
      },
      {
        "fieldName": "amount",
        "fieldLabel": "销售额",
        "fieldType": "number",
        "tag": "measure"
      },
      {
        "fieldName": "quantity",
        "fieldLabel": "数量",
        "fieldType": "number",
        "tag": "measure"
      }
    ]
  }
}
```

**组件配置**：
```json
{
  "componentId": "comp-003",
  "componentType": "table",
  "datasourceId": "ds-001",
  "datasourceConfig": {
    "sourceType": "dataset",
    "bindingType": "dataset",
    "datasetConfig": {
      "datasetId": "dataset-001",
      "datasourceId": "ds-001",
      "tableColumns": [
        {
          "fieldName": "date",
          "fieldLabel": "日期",
          "width": 120
        },
        {
          "fieldName": "amount",
          "fieldLabel": "销售额",
          "width": 120
        }
      ]
    }
  }
}
```

### 3. 带过滤条件的数据源

**datasources 配置**：
```json
{
  "datasourceId": "ds-001",
  "datasourceName": "销售数据库",
  "datasourceType": "mysql",
  "datasetId": "dataset-001",
  "datasetName": "销售数据集",
  "queryConfig": {
    "selectedFields": [
      {
        "fieldName": "date",
        "fieldLabel": "日期",
        "fieldType": "date",
        "tag": "dimension"
      },
      {
        "fieldName": "amount",
        "fieldLabel": "销售额",
        "fieldType": "number",
        "tag": "measure"
      }
    ]
  },
  "filters": [
    {
      "field": "date",
      "operator": "between",
      "source": "control",
      "sourceId": "comp-004",
      "valuePath": "value"
    }
  ],
  "parameters": {
    "startDate": {
      "type": "date",
      "source": "control",
      "sourceId": "comp-004",
      "path": "value[0]"
    },
    "endDate": {
      "type": "date",
      "source": "control",
      "sourceId": "comp-004",
      "path": "value[1]"
    }
  }
}
```

## 与前端 DatasetConfig 的映射关系

前端 `DatasetConfig` 结构：
```typescript
{
  datasetId: string;
  datasourceId: string;
  xAxisField?: string;
  yAxisField?: string;
  tableColumns?: TableColumn[];
  params?: Record<string, any>;
}
```

**映射关系**：
- datasources 中的 `datasetId` → 组件 datasourceConfig.datasetConfig.datasetId
- datasources 中的 `datasourceId` → 组件 datasourceConfig.datasetConfig.datasourceId
- 组件 datasourceConfig.datasetConfig.xAxisField → 图表 X 轴字段
- 组件 datasourceConfig.datasetConfig.yAxisField → 图表 Y 轴字段
- 组件 datasourceConfig.datasetConfig.tableColumns → 表格列配置
- datasources 中的 `parameters` → 组件 datasourceConfig.datasetConfig.params

## 设计说明

1. **datasources** 定义共享的数据源配置，包含：
   - 数据集ID和基本信息
   - `queryConfig.selectedFields`：明确指定要查询的字段列表
   - 全局过滤条件和参数配置

2. **组件级别**的 `datasourceConfig` 配置具体的数据绑定，包括：
   - 图表组件的 X 轴和 Y 轴字段选择（必须来自 `selectedFields`）
   - 表格组件的列配置（必须来自 `selectedFields`）
   - 组件特定的参数

3. **source: control 的含义**：
   - 表示参数或过滤条件的值来源于**控制类组件**（如日期选择器、下拉框、输入框等）
   - 当 `source` 为 `control` 时，必须指定 `sourceId` 来引用具体的控制组件
   - 使用 `path` 或 `valuePath` 从控制组件的值中提取所需部分（如日期范围的开始/结束日期）
   - 示例：日期范围选择器返回 `["2024-01-01", "2024-12-31"]`，可以通过 `path: "value[0]"` 获取开始日期

4. 这种设计允许：
   - 多个组件共享同一个数据源
   - 数据源明确指定可用的字段列表（`selectedFields`）
   - 每个组件从 `selectedFields` 中选择不同的字段组合
   - 数据源级别的过滤条件应用于所有使用该数据源的组件
   - 字段信息（名称、类型、标签）在数据源级别统一管理
   - 通过控制组件实现动态数据过滤和参数绑定

## source: control 使用示例

假设有一个日期范围选择器组件（comp-004），用户选择了日期范围 `["2024-01-01", "2024-12-31"]`：

```json
{
  "filters": [
    {
      "field": "date",
      "operator": "between",
      "source": "control",
      "sourceId": "comp-004",
      "valuePath": "value"
    }
  ],
  "parameters": {
    "startDate": {
      "type": "date",
      "source": "control",
      "sourceId": "comp-004",
      "path": "value[0]"
    },
    "endDate": {
      "type": "date",
      "source": "control",
      "sourceId": "comp-004",
      "path": "value[1]"
    }
  }
}
```

- `filters` 中的 `valuePath: "value"` 表示使用整个数组作为过滤值
- `parameters.startDate` 的 `path: "value[0]"` 表示提取数组的第一个元素（开始日期）
- `parameters.endDate` 的 `path: "value[1]"` 表示提取数组的第二个元素（结束日期）

