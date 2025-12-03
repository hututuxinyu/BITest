# 设计态BI系统功能差距分析

## 目标
实现从拖拽的初始组件到生成完整schema文件（如 `example-report-schema.json`）的完整功能。

## 当前系统功能现状

### ✅ 已有功能

1. **画布配置**
   - 画布尺寸（width, height）
   - 画布背景色（backgroundColor）
   - 网格显示（grid, gridSize）

2. **组件基础属性**
   - 组件名称、描述
   - 位置和尺寸（position, size）
   - 可见性、锁定状态
   - 层级（zIndex）
   - 基础样式（backgroundColor, border, shadow）

3. **数据源配置（部分）**
   - 数据集绑定（dataset）
   - 静态数据配置（static）

4. **交互配置（部分）**
   - 基础的事件类型选择
   - 基础的动作类型选择

5. **Schema加载**
   - 能够从schema文件加载到画布

### ❌ 缺失功能

## 功能差距详细分析

### 1. 数据源配置（Datasources）功能差距

#### 当前状态
- ✅ 支持数据集选择
- ✅ 支持静态数据配置
- ❌ 不支持完整的datasources配置结构

#### 需要增加的功能

**1.1 数据源连接配置（connectionConfig）**
- [ ] 支持多种数据源类型：mysql, postgresql, oracle, hive, clickhouse, elasticsearch, api, file
- [ ] 连接配置表单：host, port, database, username, password, url, options
- [ ] 数据源管理界面（创建、编辑、测试连接）

**1.2 查询配置（queryConfig）**
- [ ] SQL查询编辑器（支持语法高亮、参数占位符）
- [ ] 参数配置面板：
  - 参数名称（name）
  - 参数类型（type: string/number/date/boolean）
  - 参数来源（source: static/control/url/user）
  - 来源组件ID（sourceId，当source为control时）
  - 参数值（value，当source为static时）
- [ ] 过滤条件配置（filters）：
  - 字段（field）
  - 操作符（operator: eq/ne/gt/gte/lt/lte/like/in/notIn/between）
  - 值（value）
- [ ] 字段映射配置（fieldMapping）

**1.3 API数据源配置**
- [ ] API URL配置
- [ ] HTTP方法选择（GET/POST/PUT/DELETE）
- [ ] 请求头配置（apiHeaders）
- [ ] 请求体配置（apiBody）
- [ ] 查询参数配置（queryParams）

**1.4 文件数据源配置**
- [ ] 文件路径配置（filePath）
- [ ] 文件类型选择（csv/excel/json）

**1.5 数据源共享机制**
- [ ] 支持创建共享数据源（datasources数组）
- [ ] 组件通过datasourceId引用共享数据源
- [ ] 数据源参数绑定到控制类组件

### 2. 交互配置（Interactions）功能差距

#### 当前状态
- ✅ 基础的事件类型选择（click, hover等）
- ✅ 基础的动作类型选择（drillDown, filter等）
- ❌ 不支持多事件、多动作
- ❌ 不支持条件配置
- ❌ 不支持参数表达式
- ❌ 不支持目标组件选择

#### 需要增加的功能

**2.1 多事件支持**
- [ ] 支持一个组件配置多个事件
- [ ] 事件列表管理（添加、删除、编辑）
- [ ] 事件类型完整支持：click, hover, select, input, change, search

**2.2 事件条件配置（conditions）**
- [ ] 条件列表管理
- [ ] 条件字段选择
- [ ] 条件操作符选择
- [ ] 条件值配置

**2.3 多动作支持**
- [ ] 支持一个事件配置多个动作
- [ ] 动作列表管理（添加、删除、编辑、排序）
- [ ] 动作类型完整支持：drillDown, associate, jump, filter, popup, refresh, dynamicEvent

**2.4 动作参数配置（params）**
- [ ] 参数表达式编辑器
- [ ] 支持表达式语法：${value[0]}, ${data.field}, ${context.param}
- [ ] 参数预览和验证

**2.5 动作目标配置**
- [ ] 目标组件选择器（从画布中所有组件选择）
- [ ] 目标组件ID显示和验证

**2.6 动作配置（config）**
- [ ] 下钻配置（drillDownField, targetField）
- [ ] 跳转配置（url）
- [ ] 弹窗配置（content）
- [ ] 动态事件完整配置（apiConfig, authConfig, paramMapping, responseConfig, errorHandling）

**2.7 动态事件高级配置**
- [ ] API配置（url, method, headers, queryParams, body, timeout）
- [ ] 认证配置（type: none/bearer/apiKey/basic）
- [ ] 参数映射配置（componentData, userData, contextData, staticParams）
- [ ] 响应处理配置（dataPath, successCondition, errorPath, transform）
- [ ] 错误处理配置（retry, fallback）

### 3. 组件属性配置功能差距

#### 当前状态
- ✅ 基础信息（名称、描述、ID）
- ✅ 位置尺寸
- ✅ 基础样式
- ❌ 不支持组件props配置
- ❌ 不支持组件i18n配置
- ❌ 不支持组件style完整配置

#### 需要增加的功能

**3.1 组件Props配置**
- [ ] 根据组件类型动态显示props配置表单
- [ ] 从组件定义（ComponentDefinition）读取propsSchema
- [ ] 支持各种类型的props：string, number, boolean, object, array
- [ ] Props值实时预览

**3.2 组件i18n配置**
- [ ] 多语言文本配置面板
- [ ] 支持语言：zh-CN, en-US
- [ ] 语言切换和编辑
- [ ] 字段映射配置（fieldMappings）

**3.3 组件Style完整配置**
- [ ] 背景颜色（backgroundColor）
- [ ] 文字颜色（color）
- [ ] 字体大小（fontSize）
- [ ] 字体类型（fontFamily）
- [ ] 边框完整配置（width, style, color, radius）
- [ ] 阴影完整配置（x, y, blur, color）
- [ ] 透明度（opacity）

### 4. 画布配置功能差距

#### 当前状态
- ✅ 画布尺寸、背景色、网格
- ❌ 不支持画布i18n配置
- ❌ 不支持报表style配置

#### 需要增加的功能

**4.1 画布i18n配置**
- [ ] 报表名称多语言（reportName）
- [ ] 报表描述多语言（description）
- [ ] 字段映射多语言（fieldMappings）

**4.2 报表Style配置**
- [ ] 报表背景配置（reportBackground）：
  - 类型选择（color/gradient/image/video）
  - 值配置
  - 高级配置（config）
- [ ] 主题配置（theme）：
  - 主题ID（themeId）
  - 主题名称（themeName）

### 5. Schema生成功能差距

#### 当前状态
- ✅ 能够从schema加载到画布
- ❌ 无法从画布生成完整schema
- ❌ 无法保存schema到后端

#### 需要增加的功能

**5.1 Schema生成核心功能**
- [ ] 实现 `generateSchema()` 函数
- [ ] 从画布组件生成components数组
- [ ] 从组件数据源配置聚合生成datasources数组
- [ ] 从组件交互配置聚合生成interactions数组
- [ ] 从组件和画布配置生成i18n对象
- [ ] 从组件和画布配置生成style对象

**5.2 Schema结构生成**
- [ ] 生成version字段
- [ ] 生成reportId字段
- [ ] 生成reportName字段
- [ ] 生成reportType字段
- [ ] 生成metadata对象（createTime, updateTime, creator, description）
- [ ] 生成canvas对象
- [ ] 生成components数组（包含所有组件配置）
- [ ] 生成datasources数组（去重和聚合）
- [ ] 生成interactions数组（按componentId分组）
- [ ] 生成i18n对象（聚合所有多语言配置）
- [ ] 生成style对象（聚合所有样式配置）

**5.3 Schema保存功能**
- [ ] 实现保存schema的API调用
- [ ] 调用后端 `/reports/project/{projectId}/{reportId}/schema` POST接口
- [ ] 保存前验证schema格式
- [ ] 保存成功/失败提示

**5.4 Schema验证功能**
- [ ] 保存前验证schema格式（JSON Schema验证）
- [ ] 验证必填字段
- [ ] 验证字段类型和枚举值
- [ ] 验证组件ID唯一性
- [ ] 验证数据源ID引用有效性
- [ ] 验证交互配置中的组件ID引用有效性

## TODO列表

### 优先级P0（核心功能，必须实现）

1. **数据源配置增强**
   - [ ] 支持SQL查询编辑器
   - [ ] 支持参数配置（name, type, source, sourceId, value）
   - [ ] 支持字段映射配置
   - [ ] 支持过滤条件配置

2. **交互配置增强**
   - [ ] 支持多事件配置
   - [ ] 支持多动作配置
   - [ ] 支持动作参数表达式（${value[0]}等）
   - [ ] 支持目标组件选择

3. **Schema生成功能**
   - [ ] 实现从画布生成完整schema
   - [ ] 实现schema保存到后端
   - [ ] 实现schema格式验证

### 优先级P1（重要功能）

4. **组件Props配置**
   - [ ] 根据组件类型动态显示props表单
   - [ ] 从组件定义读取propsSchema

5. **组件i18n配置**
   - [ ] 多语言文本配置面板
   - [ ] 字段映射配置

6. **组件Style完整配置**
   - [ ] 完整的样式配置表单

### 优先级P2（增强功能）

7. **数据源高级功能**
   - [ ] API数据源配置
   - [ ] 文件数据源配置
   - [ ] 数据源连接测试

8. **交互配置高级功能**
   - [ ] 事件条件配置
   - [ ] 动态事件完整配置

9. **画布配置增强**
   - [ ] 画布i18n配置
   - [ ] 报表style配置

## 实现建议

### 阶段一：核心数据流（P0）
1. 实现数据源参数配置
2. 实现交互配置多事件/多动作
3. 实现Schema生成和保存

### 阶段二：配置完善（P1）
1. 实现组件Props配置
2. 实现i18n配置
3. 实现Style完整配置

### 阶段三：高级功能（P2）
1. 实现API/文件数据源
2. 实现动态事件完整配置
3. 实现画布高级配置

## 技术实现要点

1. **数据源配置存储**
   - 在CanvasItem中存储datasourceConfig
   - 支持组件独立数据源和共享数据源两种模式
   - 实现数据源去重和聚合逻辑

2. **交互配置存储**
   - 在CanvasItem中存储interactionConfig
   - 支持多事件、多动作的嵌套结构
   - 实现交互配置的验证和引用检查

3. **Schema生成策略**
   - 从画布组件遍历生成components
   - 从组件数据源配置聚合生成datasources（去重）
   - 从组件交互配置聚合生成interactions（按componentId分组）
   - 从组件和画布配置聚合生成i18n和style

4. **配置面板组织**
   - 数据源配置：连接配置 + 查询配置 + 参数配置
   - 交互配置：事件列表 + 动作列表 + 参数配置
   - 组件属性：基础信息 + Props + i18n + Style

