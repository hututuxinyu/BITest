# 右侧配置面板AR软件实现设计文档

## 1 需求重述

### 1.1 需求背景
在报表编辑界面中，右侧配置面板用于配置画布中选中组件的各项属性。当前实现仅包含基础的属性配置功能，需要根据系统设计文档完善数据源配置和交互配置功能。

### 1.2 需求功能介绍
右侧配置面板应包含三个主要页签：
- **数据页签**：配置组件的数据来源和绑定方式
- **基础页签**：配置组件的样式和基础属性
- **交互页签**：配置组件的交互行为和事件

## 2 功能实现分析

### 2.1 功能点清单
1. 数据页签实现
   - 数据来源选择
   - 绑定方式配置（数据集配置/静态配置）
   - 静态配置JSON编辑器
2. 基础页签实现
   - 组件样式配置
   - 组件基础属性配置
3. 交互页签实现
   - 交互事件选择
   - 交互动作配置
   - 动态事件配置

### 2.2 功能点1：数据页签实现

#### 2.2.1 详细描述

**UI结构**：
```
数据页签
├── 数据来源
│   └── 下拉选择框（数据集/静态数据）
├── 绑定方式
│   ├── 数据集配置（Radio选项）
│   └── 静态配置（Radio选项）
│       └── 配置按钮
│           └── 弹出Modal
│               └── JSON编辑器（Monaco Editor或TextArea）
```

**数据结构**：
```typescript
interface DatasourceConfig {
  sourceType: 'dataset' | 'static'; // 数据来源类型
  bindingType: 'dataset' | 'static'; // 绑定方式
  datasetConfig?: {
    datasourceId: string; // 数据源ID
    query: string; // SQL查询语句
    params?: Record<string, any>; // 查询参数
  };
  staticConfig?: {
    data: any[]; // 静态数据（JSON格式）
  };
}
```

**组件实现**：
```typescript
// frontend/src/components/DatasourceConfigPanel.tsx
interface DatasourceConfigPanelProps {
  item?: CanvasItem;
  onConfigChange: (config: DatasourceConfig) => void;
}

const DatasourceConfigPanel: React.FC<DatasourceConfigPanelProps> = ({
  item,
  onConfigChange
}) => {
  const [sourceType, setSourceType] = useState<'dataset' | 'static'>('dataset');
  const [bindingType, setBindingType] = useState<'dataset' | 'static'>('dataset');
  const [staticDataJson, setStaticDataJson] = useState<string>('[]');
  const [jsonModalVisible, setJsonModalVisible] = useState(false);
  
  // 数据来源选择
  const handleSourceTypeChange = (value: 'dataset' | 'static') => {
    setSourceType(value);
    setBindingType(value); // 同步绑定方式
    onConfigChange({
      sourceType: value,
      bindingType: value,
      ...(value === 'static' ? { staticConfig: { data: [] } } : {})
    });
  };
  
  // 绑定方式选择
  const handleBindingTypeChange = (value: 'dataset' | 'static') => {
    setBindingType(value);
    onConfigChange({
      sourceType,
      bindingType: value,
      ...(value === 'static' ? { staticConfig: { data: [] } } : {})
    });
  };
  
  // 静态配置JSON编辑
  const handleStaticConfigSave = () => {
    try {
      const data = JSON.parse(staticDataJson);
      onConfigChange({
        sourceType,
        bindingType: 'static',
        staticConfig: { data }
      });
      setJsonModalVisible(false);
      message.success('静态配置保存成功');
    } catch (error) {
      message.error('JSON格式错误，请检查输入');
    }
  };
  
  return (
    <Form layout="vertical">
      <Form.Item label="数据来源">
        <Select
          value={sourceType}
          onChange={handleSourceTypeChange}
          options={[
            { label: '数据集', value: 'dataset' },
            { label: '静态数据', value: 'static' }
          ]}
        />
      </Form.Item>
      
      <Form.Item label="绑定方式">
        <Radio.Group
          value={bindingType}
          onChange={(e) => handleBindingTypeChange(e.target.value)}
        >
          <Radio value="dataset">数据集配置</Radio>
          <Radio value="static">静态配置</Radio>
        </Radio.Group>
      </Form.Item>
      
      {bindingType === 'dataset' && (
        <Form.Item label="数据集">
          <Select
            placeholder="请选择数据集"
            options={[]} // 从API获取数据集列表
          />
        </Form.Item>
      )}
      
      {bindingType === 'static' && (
        <Form.Item>
          <Button
            type="primary"
            onClick={() => setJsonModalVisible(true)}
          >
            配置静态数据
          </Button>
        </Form.Item>
      )}
      
      <Modal
        title="静态数据配置"
        visible={jsonModalVisible}
        onOk={handleStaticConfigSave}
        onCancel={() => setJsonModalVisible(false)}
        width={600}
      >
        <Form.Item label="JSON数据格式">
          <Input.TextArea
            rows={12}
            value={staticDataJson}
            onChange={(e) => setStaticDataJson(e.target.value)}
            placeholder='请输入JSON格式数据，例如：[{"name": "分类A", "value": 100}]'
          />
        </Form.Item>
      </Modal>
    </Form>
  );
};
```

**数据库表设计**：
```sql
-- 组件数据源配置表
CREATE TABLE component_datasource_config (
  id BIGSERIAL PRIMARY KEY,
  component_id VARCHAR(255) NOT NULL, -- 组件实例ID
  report_id BIGINT NOT NULL, -- 报表ID
  source_type VARCHAR(20) NOT NULL, -- 数据来源类型：dataset/static
  binding_type VARCHAR(20) NOT NULL, -- 绑定方式：dataset/static
  dataset_config JSONB, -- 数据集配置（JSON格式）
  static_config JSONB, -- 静态配置（JSON格式）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

-- 索引
CREATE INDEX idx_component_datasource_component_id ON component_datasource_config(component_id);
CREATE INDEX idx_component_datasource_report_id ON component_datasource_config(report_id);
```

**API接口设计**：
```typescript
// frontend/src/services/datasourceApi.ts
export const datasourceApi = {
  // 获取组件数据源配置
  getComponentDatasourceConfig: async (componentId: string): Promise<DatasourceConfig> => {
    const response = await fetch(`/api/components/${componentId}/datasource`);
    return response.json();
  },
  
  // 保存组件数据源配置
  saveComponentDatasourceConfig: async (
    componentId: string,
    config: DatasourceConfig
  ): Promise<void> => {
    await fetch(`/api/components/${componentId}/datasource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },
  
  // 获取数据集列表
  getDatasetList: async (): Promise<Dataset[]> => {
    const response = await fetch('/api/datasets');
    return response.json();
  },
  
  // 预览数据
  previewData: async (
    datasourceId: string,
    query: string
  ): Promise<any[]> => {
    const response = await fetch('/api/datasources/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datasourceId, query })
    });
    return response.json();
  }
};
```

**后端Controller实现**：
```java
// backend/src/main/java/com/dialtest/center/controller/ComponentDatasourceController.java
@RestController
@RequestMapping("/api/components")
public class ComponentDatasourceController {
  
  @Autowired
  private ComponentDatasourceService datasourceService;
  
  @GetMapping("/{componentId}/datasource")
  public ResponseEntity<DatasourceConfig> getDatasourceConfig(
    @PathVariable String componentId
  ) {
    DatasourceConfig config = datasourceService.getConfig(componentId);
    return ResponseEntity.ok(config);
  }
  
  @PostMapping("/{componentId}/datasource")
  public ResponseEntity<Void> saveDatasourceConfig(
    @PathVariable String componentId,
    @RequestBody DatasourceConfig config
  ) {
    datasourceService.saveConfig(componentId, config);
    return ResponseEntity.ok().build();
  }
}
```

### 2.3 功能点2：基础页签实现

#### 2.3.1 详细描述

**UI结构**：
```
基础页签
├── 组件标题
├── 组件描述
├── 样式配置
│   ├── 颜色配置
│   ├── 字体配置
│   ├── 边框配置
│   └── 背景配置
└── 显示控制
    └── 显示/隐藏开关
```

**组件实现**：
```typescript
// frontend/src/components/PropertyConfigPanel.tsx
const PropertyConfigPanel: React.FC<PropertyPanelProps> = ({
  item,
  onPropChange,
  selectedCount = 0
}) => {
  // 使用现有的PropertyPanel实现
  // 扩展支持样式配置
  return (
    <Form layout="vertical">
      {/* 基础属性 */}
      {item.definition.propsSchema.map((schema) => (
        <Form.Item key={schema.field} label={schema.label}>
          {renderFormField(schema.type, values[schema.field], schema.options, (value) => 
            onPropChange(schema.field, value)
          )}
        </Form.Item>
      ))}
      
      {/* 样式配置 */}
      <Collapse>
        <Collapse.Panel header="样式配置" key="style">
          <Form.Item label="背景色">
            <Input type="color" />
          </Form.Item>
          <Form.Item label="字体大小">
            <InputNumber min={10} max={72} />
          </Form.Item>
          <Form.Item label="边框">
            <InputNumber placeholder="边框宽度" />
          </Form.Item>
        </Collapse.Panel>
      </Collapse>
    </Form>
  );
};
```

### 2.4 功能点3：交互页签实现

#### 2.4.1 详细描述

**UI结构**：
```
交互页签
├── 交互事件选择
│   └── 事件类型下拉框（点击、悬停、选择等）
├── 交互动作配置
│   ├── 动作类型（下钻、关联、跳转、过滤、弹窗、动态事件）
│   └── 动作参数配置
└── 动态事件配置（当选择动态事件时显示）
    ├── REST API配置
    ├── 参数映射
    ├── 请求认证
    └── 响应处理
```

**数据结构**：
```typescript
interface InteractionConfig {
  eventType: 'click' | 'hover' | 'select' | 'input' | 'change';
  actions: Array<{
    type: 'drillDown' | 'associate' | 'jump' | 'filter' | 'popup' | 'dynamicEvent';
    config: any; // 动作特定配置
  }>;
  dynamicEvent?: {
    apiUrl: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
    auth?: {
      type: 'bearer' | 'apikey' | 'basic';
      config: any;
    };
    paramMapping?: Array<{
      source: string; // 数据来源
      target: string; // 目标参数名
    }>;
  };
}
```

**组件实现**：
```typescript
// frontend/src/components/InteractionConfigPanel.tsx
const InteractionConfigPanel: React.FC<InteractionConfigPanelProps> = ({
  item,
  onConfigChange
}) => {
  const [eventType, setEventType] = useState<string>('click');
  const [actionType, setActionType] = useState<string>('');
  const [dynamicEventConfig, setDynamicEventConfig] = useState<any>(null);
  
  return (
    <Form layout="vertical">
      <Form.Item label="交互事件">
        <Select
          value={eventType}
          onChange={setEventType}
          options={[
            { label: '点击', value: 'click' },
            { label: '悬停', value: 'hover' },
            { label: '选择', value: 'select' },
            { label: '输入', value: 'input' },
            { label: '值变更', value: 'change' }
          ]}
        />
      </Form.Item>
      
      <Form.Item label="交互动作">
        <Select
          value={actionType}
          onChange={setActionType}
          options={[
            { label: '下钻', value: 'drillDown' },
            { label: '关联', value: 'associate' },
            { label: '跳转', value: 'jump' },
            { label: '过滤', value: 'filter' },
            { label: '弹窗', value: 'popup' },
            { label: '动态事件', value: 'dynamicEvent' }
          ]}
        />
      </Form.Item>
      
      {actionType === 'dynamicEvent' && (
        <DynamicEventConfig
          config={dynamicEventConfig}
          onChange={setDynamicEventConfig}
        />
      )}
    </Form>
  );
};
```

## 3 AR开发者测试设计

### 3.1 DT用例列表

#### 3.1.1 数据页签测试用例

**用例1：数据来源选择**
- **被测对象**：`DatasourceConfigPanel.handleSourceTypeChange`
- **主场景**：用户选择"数据集"或"静态数据"
- **分支场景**：
  - 选择"数据集"时，绑定方式自动切换为"数据集配置"
  - 选择"静态数据"时，绑定方式自动切换为"静态配置"
- **测试因子**：sourceType值（'dataset' | 'static'）

**用例2：静态配置JSON编辑**
- **被测对象**：`DatasourceConfigPanel.handleStaticConfigSave`
- **主场景**：用户输入有效JSON并保存
- **分支场景**：
  - 输入有效JSON数组：`[{"name": "A", "value": 100}]`
  - 输入有效JSON对象：`{"data": [1, 2, 3]}`
  - 输入无效JSON：`[{name: "A"}]`（缺少引号）
  - 输入空字符串
  - 输入非JSON格式文本
- **测试因子**：
  - JSON格式有效性
  - JSON数据类型（数组/对象）
  - 边界值（空数组、空对象、超大JSON）

**用例3：数据集配置选择**
- **被测对象**：`DatasourceConfigPanel.handleDatasetSelect`
- **主场景**：用户从下拉列表选择数据集
- **分支场景**：
  - 选择有效数据集ID
  - 数据集列表为空
  - 数据集加载失败
- **测试因子**：数据集ID有效性、数据集列表状态

#### 3.1.2 基础页签测试用例

**用例4：属性值更新**
- **被测对象**：`PropertyPanel.onPropChange`
- **主场景**：用户修改组件属性值
- **分支场景**：
  - 修改字符串属性
  - 修改数字属性
  - 修改布尔属性
  - 修改枚举属性
- **测试因子**：属性类型、属性值有效性

#### 3.1.3 交互页签测试用例

**用例5：交互事件配置**
- **被测对象**：`InteractionConfigPanel.handleEventTypeChange`
- **主场景**：用户选择交互事件类型
- **分支场景**：
  - 选择不同事件类型（click/hover/select/input/change）
  - 事件类型切换时，动作配置重置
- **测试因子**：事件类型值

**用例6：动态事件API配置**
- **被测对象**：`DynamicEventConfig.handleApiConfigChange`
- **主场景**：用户配置REST API参数
- **分支场景**：
  - 配置GET请求
  - 配置POST请求（带请求体）
  - 配置认证方式（Bearer Token/API Key/Basic Auth）
  - API URL格式验证
  - 请求头格式验证
- **测试因子**：
  - HTTP方法类型
  - 认证类型
  - URL格式有效性
  - 请求头格式有效性

### 3.2 DT用例实现对应关系

| 用例编号 | 被测函数/组件 | 测试方法 | 预期结果 |
|---------|-------------|---------|---------|
| 用例1 | `handleSourceTypeChange` | 测试sourceType切换 | 绑定方式同步更新 |
| 用例2 | `handleStaticConfigSave` | 测试JSON解析和验证 | 有效JSON保存成功，无效JSON提示错误 |
| 用例3 | `handleDatasetSelect` | 测试数据集选择 | 数据集ID正确保存 |
| 用例4 | `onPropChange` | 测试属性值更新 | 组件属性实时更新 |
| 用例5 | `handleEventTypeChange` | 测试事件类型选择 | 事件类型正确保存 |
| 用例6 | `handleApiConfigChange` | 测试API配置 | API配置参数正确保存 |

## 4 实现步骤

### 4.1 第一阶段：数据页签基础功能
1. 创建`DatasourceConfigPanel`组件
2. 实现数据来源选择功能
3. 实现绑定方式选择功能
4. 实现静态配置JSON编辑器Modal

### 4.2 第二阶段：数据页签高级功能
1. 实现数据集列表获取和选择
2. 实现数据预览功能
3. 实现数据源配置保存和加载

### 4.3 第三阶段：基础页签扩展
1. 扩展样式配置功能
2. 实现属性实时预览

### 4.4 第四阶段：交互页签实现
1. 创建`InteractionConfigPanel`组件
2. 实现交互事件选择
3. 实现交互动作配置
4. 实现动态事件配置

## 5 技术要点

### 5.1 JSON编辑器选择
- 推荐使用`@monaco-editor/react`或`react-json-view`
- 简单场景可使用`Input.TextArea`配合JSON验证

### 5.2 数据验证
- 使用`JSON.parse`进行JSON格式验证
- 使用`try-catch`捕获解析错误
- 提供友好的错误提示

### 5.3 状态管理
- 使用React Hooks管理组件状态
- 配置变更时及时同步到画布组件
- 支持撤销/重做功能

### 5.4 性能优化
- 大数据量时使用虚拟滚动
- JSON编辑器使用防抖处理
- 配置保存使用异步处理




