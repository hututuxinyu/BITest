## 1 需求重述

### 1.2 需求背景
组件库管理模块是设计态系统的核心能力之一（参考《设计态系统设计说明书》4.6.3），为报表设计人员提供统一、可扩展的组件资源库。模块需要支持组件的分类展示、预览、搜索、拖拽到画布，以及组件元数据（属性 Schema、默认值、Mock 数据、事件定义等）的统一管理，并为左侧组件库面板和运行态渲染提供一致的数据源。同时，模块需要支持控制类组件、容器类组件、三维组件等多类型扩展，并满足插件化、版本化、Mock 数据等工程化要求。

### 1.3 需求功能介绍
1. **组件分类管理**：按照“基础图表/三维图表/多媒体/容器/控制类”等维度展示组件，支持子分类和自定义标签。
2. **组件搜索与过滤**：支持名称关键字、标签、分类等组合筛选，便于快速定位组件。
3. **组件预览与说明**：展示组件缩略图、用途说明、示例 GIF/图片、版本信息。
4. **组件拖拽实例化**：支持将组件拖拽到画布，生成组件实例（含默认属性、事件、Mock 数据）。
5. **组件元数据管理**：维护组件属性 Schema、事件定义、默认样式、Mock 数据等结构化信息，供右侧配置面板、数据源/交互模块复用。
6. **控制类/容器组件特性**：支持控制类组件暴露事件与参数，容器类支持子组件管理与布局约束。
7. **组件插件化扩展**：支持外部组件包注册、版本管理和启停控制。

## 2 功能实现分析

### 2.1 功能点清单
1. 组件分类与标签管理  
2. 组件浏览、搜索与预览  
3. 组件拖拽实例化与默认配置生成  
4. 组件元数据（属性/事件/Mock）管理  
5. 控制类与容器类组件特殊能力  
6. 组件插件注册与版本管理  

### 2.2 功能点1：组件分类与标签管理
#### 详细描述
**数据结构**  
```sql
CREATE TABLE component_category (
    category_id VARCHAR(64) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_id VARCHAR(64),
    order_no INT DEFAULT 0,
    icon VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE component_tag (
    tag_id VARCHAR(64) PRIMARY KEY,
    tag_name VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE component_category_rel (
    component_id VARCHAR(64),
    category_id VARCHAR(64),
    PRIMARY KEY(component_id, category_id)
);

CREATE TABLE component_tag_rel (
    component_id VARCHAR(64),
    tag_id VARCHAR(64),
    PRIMARY KEY(component_id, tag_id)
);
```

**算法流程**  
1. 加载分类树（parent-child 结构，缓存至前端）。  
2. 加载标签列表（可用于过滤）。  
3. 组件在列表中附带分类、标签信息，左侧面板按分类节点渲染。  

**主要接口**  
- `GET /api/components/categories`：获取分类树  
- `GET /api/components/tags`：获取标签列表  
- `POST /api/components/category`：新增/编辑分类  
- `POST /api/components/tag`：新增/编辑标签  

### 2.3 功能点2：组件浏览、搜索与预览
#### 详细描述
**组件主数据结构**  
```sql
CREATE TABLE component (
    component_id VARCHAR(64) PRIMARY KEY,
    component_name VARCHAR(100) NOT NULL,
    alias VARCHAR(100),
    version VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,   -- chart, media, control, container, 3d 等
    icon VARCHAR(255),
    preview_url VARCHAR(255),
    description TEXT,
    author VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    release_time TIMESTAMP
);
```

**接口与流程**  
1. `GET /api/components` 支持分页、关键字、分类、标签、类型等过滤。  
2. 响应结构包含组件基本信息、预览图、标签、版本。  
3. 前端组件库面板支持：  
   - 分类展开/折叠  
   - 关键字搜索  
   - 鼠标 Hover 显示组件说明/版本  
   - 预览弹窗（展示示例图/GIF + 属性简介 + Mock 示例）  

**伪代码**  
```typescript
async function listComponents(filter: ComponentFilter): Promise<PageResult<ComponentSummary>> {
  const query = buildQuery(filter); // keyword, categories, tags, type
  const rows = await componentRepository.select(query);
  return mapToSummary(rows);
}
```

### 2.4 功能点3：组件拖拽实例化与默认配置生成
#### 详细描述
**实例化流程**  
1. 拖拽组件时，发送 `GET /api/components/{id}/definition`，返回组件完整定义（属性 Schema、默认值、事件、Mock 数据、依赖资源列表等）。  
2. 前端根据返回的 Definition 生成组件实例对象：  
```json
{
  "componentId": "chart-bar",
  "instanceId": "inst-uuid",
  "props": { ...默认属性... },
  "dataSource": { ...默认数据源配置/Mock... },
  "events": { ...默认事件... },
  "style": { width, height, position },
  "children": []
}
```
3. 将实例对象写入画布状态（Redux/Vuex），并触发右侧配置面板展示对应 Schema。  

**伪代码**  
```typescript
async function createInstance(componentId: string): Promise<ComponentInstance> {
  const definition = await api.getDefinition(componentId);
  return {
    componentId,
    instanceId: uuid(),
    props: clone(definition.defaultProps),
    dataSource: definition.defaultDataSource,
    events: definition.defaultEvents,
    style: definition.defaultStyle,
    children: []
  };
}
```

### 2.5 功能点4：组件元数据（属性/事件/Mock）管理
#### 详细描述
**元数据结构**  
```sql
CREATE TABLE component_definition (
    component_id VARCHAR(64),
    version VARCHAR(20),
    props_schema JSONB,
    default_props JSONB,
    data_schema JSONB,
    default_data JSONB,
    event_schema JSONB,
    default_events JSONB,
    support_features JSONB, -- 如 drillDown、interaction、dataBinding
    PRIMARY KEY(component_id, version)
);
```

**用途**  
- 属性 Schema 供右侧配置面板动态生成表单。  
- 数据 Schema 定义数据源字段映射要求。  
- Mock 数据用于画布预览和模板预览。  
- 事件 Schema 定义支持的交互事件、参数、触发条件。  

**接口**  
- `GET /api/components/{id}/definition?version=latest`  
- `POST /api/components/{id}/definition`（管理员/组件开发者使用）  
- `GET /api/components/{id}/mock-data`  

### 2.6 功能点5：控制类与容器类组件特殊能力
#### 详细描述
**控制类组件需求**  
- 支持事件来源（click/change/input 等）。  
- 暴露参数映射定义，用于交互配置模块。  
- 同步/异步触发模式、节流/防抖配置。  

**容器类组件需求**  
- 定义允许的子组件类型/数量约束。  
- 定义布局方式（自由/网格/分栏等）和子组件定位策略。  
- 拖拽子组件进入容器时进行合法性校验。  

**数据结构扩展**  
```json
{
  "componentId": "container-tab",
  "feature": {
    "container": {
      "allowedChildren": ["chart-*", "media-*"],
      "layout": "tab",
      "maxChildren": 10
    },
    "control": null
  }
}
```

**流程**  
1. 拖拽子组件到容器时，校验 `allowedChildren`。  
2. 控制类组件配置完成后，交互模块读取其事件定义并暴露给连线/事件配置 UI。  

### 2.7 功能点6：组件插件注册与版本管理
#### 详细描述
**需求**  
- 支持第三方组件包注册，包含 package 信息、版本、依赖资源（JS/CSS）。  
- 支持启用/停用某个组件版本。  
- 支持热更新/懒加载组件资源。  

**数据结构**  
```sql
CREATE TABLE component_package (
    package_id VARCHAR(64) PRIMARY KEY,
    package_name VARCHAR(100),
    version VARCHAR(20),
    entry_js VARCHAR(255),
    style_url VARCHAR(255),
    checksum VARCHAR(64),
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE component_package_rel (
    component_id VARCHAR(64),
    package_id VARCHAR(64),
    PRIMARY KEY(component_id, package_id)
);
```

**流程**  
1. 管理员上传组件包（zip/tar.gz），后端解析并写入 component + definition + package 记录。  
2. 前端在加载组件库时，根据组件 package 信息动态加载远程 JS/CSS（使用 SystemJS 或 webpack module federation）。  
3. 支持切换组件版本，回滚版本。  

## 3 AR开发者测试设计

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-CL-001 | 加载分类树 | `GET /api/components/categories` | 存在父子节点 | 返回完整树结构 |
| TC-CL-002 | 分类为空 | `GET /api/components/categories` | 无记录 | 返回空数组 |
| TC-CL-003 | 关键字搜索 | `GET /api/components` | keyword=“柱状图” | 返回匹配组件 |
| TC-CL-004 | 分类+标签过滤 | `GET /api/components` | category=chart, tag=3d | 返回筛选结果 |
| TC-CL-005 | 组件预览 | 前端预览弹窗 | 组件存在 preview_url | 成功展示预览图 |
| TC-CL-006 | 拖拽实例化 | `GET /api/components/{id}/definition` | 组件存在/不存在 | 成功返回/提示不存在 |
| TC-CL-007 | 生成实例默认值 | `createInstance()` | defaultProps/defaultEvents | 实例配置与定义一致 |
| TC-CL-008 | Mock 数据加载 | `GET /api/components/{id}/mock-data` | 组件有/无 mock | 返回 mock / 空结构 |
| TC-CL-009 | 控制类事件定义 | definition.event_schema | 包含 click/change | 右侧交互配置可读取 |
| TC-CL-010 | 容器子组件校验 | 拖拽子组件到容器 | allowedChildren 限制 | 合法通过，非法提示 |
| TC-CL-011 | 插件注册成功 | `POST /api/components/packages` | 合法 zip 包 | 成功生成组件记录 |
| TC-CL-012 | 插件校验失败 | `POST /api/components/packages` | 缺少 entry_js | 返回错误信息 |
| TC-CL-013 | 版本切换 | `PUT /api/components/{id}/definition` | version=指定值 | 生效新版本 |
| TC-CL-014 | 组件停用 | `PUT /api/components/{id}/status` | status=inactive | 前端列表不再展示 |

测试需覆盖正常/异常/边界场景，并验证：  
- 分类/标签 CRUD 功能；  
- 组件列表过滤性能；  
- 拖拽实例化正确性；  
- 属性/事件 Schema 与右侧配置联动；  
- 控制类、容器类特殊逻辑；  
- 插件注册与资源加载的等幂性、安全性；  
- Mock 数据可用性。  





