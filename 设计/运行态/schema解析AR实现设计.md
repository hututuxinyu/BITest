## 1 需求重述

### 1.2 需求背景

运行态系统是报表BI（商业智能）系统的核心运行环境，负责解析设计态生成的schema文件，实现报表界面的动态渲染、数据查询与SQL生成、交互逻辑执行、安全控制等功能。运行态与设计态采用schema文件作为桥梁，实现设计与运行的完全分离。

Schema解析模块是运行态系统的核心基础模块，负责将设计态生成的标准化schema文件解析为运行时可用的数据结构。所有运行态功能模块（界面渲染、数据查询、交互逻辑执行等）都依赖Schema解析模块的输出结果。

### 1.3 需求功能介绍

Schema解析模块提供以下核心功能：

1. **Schema文件加载**：从文件系统、数据库或对象存储中加载schema文件
2. **Schema格式验证**：验证schema文件的JSON格式正确性和结构完整性
3. **Schema版本兼容**：支持多版本schema格式，提供版本转换适配器
4. **组件树构建**：根据schema中的组件配置构建组件树结构，支持嵌套组件
5. **数据源配置提取**：从schema中提取数据源连接信息和查询配置
6. **交互配置提取**：从schema中提取交互规则配置，包括下钻、关联、跳转、过滤、动态事件等
7. **错误处理**：解析失败时提供详细的错误信息和错误定位
8. **性能优化**：支持大schema文件的快速解析，提供解析结果缓存

## 2 功能实现分析

### 2.1 功能点清单

1. **Schema文件加载**：从存储系统加载schema文件内容
2. **Schema格式验证**：验证JSON格式和schema结构完整性
3. **Schema版本处理**：识别schema版本，应用版本转换器（如需要）
4. **组件树构建**：递归构建组件树结构
5. **数据源配置提取**：提取数据源连接和查询配置
6. **交互配置提取**：提取交互规则配置
7. **解析结果缓存**：缓存解析结果，提高性能
8. **错误处理**：提供详细的错误信息和错误定位

### 2.2 功能点1：Schema文件加载

#### 详细描述

**功能说明**：从文件系统、数据库或对象存储中加载schema文件内容，支持多种存储方式。

**数据库表**：

**报表表（report）**：
```sql
CREATE TABLE report (
    report_id VARCHAR(64) PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(20) NOT NULL, -- report: 报表, dashboard: 仪表盘
    schema_file BYTEA, -- Schema文件内容（PostgreSQL BYTEA类型）
    schema_file_path VARCHAR(512), -- Schema文件路径（如果存储在文件系统或对象存储）
    schema_version VARCHAR(20) DEFAULT '1.0', -- Schema版本号
    status VARCHAR(20) DEFAULT 'published', -- draft: 草稿, published: 已发布
    creator_id VARCHAR(64),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_creator FOREIGN KEY (creator_id) REFERENCES user(user_id)
);

CREATE INDEX idx_report_status ON report(status);
CREATE INDEX idx_report_creator ON report(creator_id);
```

**算法流程**：

```
1. 接收报表ID或schema文件路径
2. 判断schema存储方式：
   - 如果schema_file字段不为空：从数据库BYTEA字段读取
   - 如果schema_file_path不为空：从文件系统或对象存储读取
3. 从数据库读取：
   a. 根据report_id查询report表
   b. 读取schema_file字段（BYTEA类型）
   c. 将BYTEA转换为字符串（UTF-8编码）
4. 从文件系统读取：
   a. 根据schema_file_path读取文件
   b. 验证文件是否存在
   c. 读取文件内容（UTF-8编码）
5. 从对象存储读取：
   a. 根据schema_file_path从对象存储下载文件
   b. 读取文件内容（UTF-8编码）
6. 返回schema文件内容（JSON字符串）
```

**函数伪代码**：

```java
/**
 * 加载Schema文件
 * @param reportId 报表ID
 * @return Schema文件内容（JSON字符串）
 */
public String loadSchema(String reportId) {
    // 1. 查询报表记录
    Report report = reportMapper.selectById(reportId);
    if (report == null) {
        throw new NotFoundException("报表不存在: " + reportId);
    }
    
    // 2. 判断schema存储方式
    if (report.getSchemaFile() != null && report.getSchemaFile().length > 0) {
        // 从数据库BYTEA字段读取
        return loadSchemaFromDatabase(report);
    } else if (StringUtils.isNotBlank(report.getSchemaFilePath())) {
        // 从文件系统或对象存储读取
        return loadSchemaFromStorage(report.getSchemaFilePath());
    } else {
        throw new BusinessException("Schema文件不存在: " + reportId);
    }
}

/**
 * 从数据库BYTEA字段加载Schema
 */
private String loadSchemaFromDatabase(Report report) {
    try {
        byte[] schemaBytes = report.getSchemaFile();
        return new String(schemaBytes, StandardCharsets.UTF_8);
    } catch (Exception e) {
        throw new BusinessException("读取Schema文件失败", e);
    }
}

/**
 * 从文件系统或对象存储加载Schema
 */
private String loadSchemaFromStorage(String filePath) {
    try {
        // 判断是文件系统路径还是对象存储路径
        if (filePath.startsWith("s3://") || filePath.startsWith("oss://")) {
            // 从对象存储读取
            return storageService.downloadFile(filePath);
        } else {
            // 从文件系统读取
            Path path = Paths.get(filePath);
            if (!Files.exists(path)) {
                throw new NotFoundException("Schema文件不存在: " + filePath);
            }
            return Files.readString(path, StandardCharsets.UTF_8);
        }
    } catch (IOException e) {
        throw new BusinessException("读取Schema文件失败: " + filePath, e);
    }
}
```

**对象类图**：

```
┌─────────────────┐
│   Report        │
├─────────────────┤
│ + reportId      │
│ + reportName    │
│ + schemaFile    │ (BYTEA)
│ + schemaFilePath│
│ + schemaVersion │
│ + status        │
└─────────────────┘
         │
         │ uses
         │
┌─────────────────┐
│ SchemaLoader    │
├─────────────────┤
│ + loadSchema()  │
│ - loadSchemaFromDatabase()│
│ - loadSchemaFromStorage() │
└─────────────────┘
         │
         │ uses
         │
┌─────────────────┐
│ StorageService  │
├─────────────────┤
│ + downloadFile()│
└─────────────────┘
```

### 2.3 功能点2：Schema格式验证

#### 详细描述

**功能说明**：验证schema文件的JSON格式正确性和结构完整性，确保schema符合规范要求。

**算法流程**：

```
1. 接收schema文件内容（JSON字符串）
2. JSON格式验证：
   a. 尝试解析JSON字符串
   b. 如果解析失败，抛出JSON格式错误异常
3. Schema结构验证：
   a. 验证必需字段是否存在：
      - version: Schema版本号
      - reportInfo: 报表基本信息
      - components: 组件配置数组
   b. 验证字段类型：
      - version必须是字符串
      - reportInfo必须是对象
      - components必须是数组
   c. 验证组件配置结构：
      - 每个组件必须有componentId和componentType
      - 验证组件类型是否支持
   d. 验证数据源配置结构（如果存在）：
      - datasources必须是对象或数组
      - 每个数据源必须有datasourceId和datasourceType
   e. 验证交互配置结构（如果存在）：
      - interactions必须是对象或数组
      - 每个交互必须有interactionId和interactionType
4. 返回验证结果（成功或错误信息列表）
```

**函数伪代码**：

```java
/**
 * 验证Schema格式
 * @param schemaContent Schema文件内容（JSON字符串）
 * @return 验证结果
 */
public ValidationResult validateSchemaFormat(String schemaContent) {
    ValidationResult result = new ValidationResult();
    List<String> errors = new ArrayList<>();
    
    // 1. JSON格式验证
    JSONObject schemaJson;
    try {
        schemaJson = JSON.parseObject(schemaContent);
    } catch (JSONException e) {
        errors.add("JSON格式错误: " + e.getMessage());
        result.setValid(false);
        result.setErrors(errors);
        return result;
    }
    
    // 2. 验证必需字段
    if (!schemaJson.containsKey("version")) {
        errors.add("缺少必需字段: version");
    }
    if (!schemaJson.containsKey("reportInfo")) {
        errors.add("缺少必需字段: reportInfo");
    }
    if (!schemaJson.containsKey("components")) {
        errors.add("缺少必需字段: components");
    }
    
    // 3. 验证字段类型
    if (schemaJson.containsKey("version") && 
        !(schemaJson.get("version") instanceof String)) {
        errors.add("version字段类型错误，必须是字符串");
    }
    if (schemaJson.containsKey("reportInfo") && 
        !(schemaJson.get("reportInfo") instanceof JSONObject)) {
        errors.add("reportInfo字段类型错误，必须是对象");
    }
    if (schemaJson.containsKey("components") && 
        !(schemaJson.get("components") instanceof JSONArray)) {
        errors.add("components字段类型错误，必须是数组");
    }
    
    // 4. 验证组件配置结构
    if (schemaJson.containsKey("components")) {
        JSONArray components = schemaJson.getJSONArray("components");
        for (int i = 0; i < components.size(); i++) {
            JSONObject component = components.getJSONObject(i);
            if (!component.containsKey("componentId")) {
                errors.add("组件[" + i + "]缺少componentId字段");
            }
            if (!component.containsKey("componentType")) {
                errors.add("组件[" + i + "]缺少componentType字段");
            } else {
                String componentType = component.getString("componentType");
                if (!isSupportedComponentType(componentType)) {
                    errors.add("组件[" + i + "]不支持的组件类型: " + componentType);
                }
            }
        }
    }
    
    // 5. 验证数据源配置结构（如果存在）
    if (schemaJson.containsKey("datasources")) {
        Object datasources = schemaJson.get("datasources");
        if (datasources instanceof JSONObject) {
            validateDatasourceConfig((JSONObject) datasources, errors);
        } else if (datasources instanceof JSONArray) {
            JSONArray datasourceArray = (JSONArray) datasources;
            for (int i = 0; i < datasourceArray.size(); i++) {
                validateDatasourceConfig(datasourceArray.getJSONObject(i), errors);
            }
        } else {
            errors.add("datasources字段类型错误，必须是对象或数组");
        }
    }
    
    // 6. 验证交互配置结构（如果存在）
    if (schemaJson.containsKey("interactions")) {
        Object interactions = schemaJson.get("interactions");
        if (interactions instanceof JSONObject) {
            validateInteractionConfig((JSONObject) interactions, errors);
        } else if (interactions instanceof JSONArray) {
            JSONArray interactionArray = (JSONArray) interactions;
            for (int i = 0; i < interactionArray.size(); i++) {
                validateInteractionConfig(interactionArray.getJSONObject(i), errors);
            }
        } else {
            errors.add("interactions字段类型错误，必须是对象或数组");
        }
    }
    
    result.setValid(errors.isEmpty());
    result.setErrors(errors);
    return result;
}

/**
 * 验证数据源配置
 */
private void validateDatasourceConfig(JSONObject datasource, List<String> errors) {
    if (!datasource.containsKey("datasourceId")) {
        errors.add("数据源配置缺少datasourceId字段");
    }
    if (!datasource.containsKey("datasourceType")) {
        errors.add("数据源配置缺少datasourceType字段");
    }
}

/**
 * 验证交互配置
 */
private void validateInteractionConfig(JSONObject interaction, List<String> errors) {
    if (!interaction.containsKey("interactionId")) {
        errors.add("交互配置缺少interactionId字段");
    }
    if (!interaction.containsKey("interactionType")) {
        errors.add("交互配置缺少interactionType字段");
    }
}

/**
 * 检查组件类型是否支持
 */
private boolean isSupportedComponentType(String componentType) {
    Set<String> supportedTypes = Set.of(
        "barChart", "lineChart", "pieChart", "table", "text", 
        "image", "button", "filter", "datePicker", "select"
    );
    return supportedTypes.contains(componentType);
}
```

**对象类图**：

```
┌──────────────────────┐
│ ValidationResult     │
├──────────────────────┤
│ + valid: boolean     │
│ + errors: List<String>│
└──────────────────────┘
         ▲
         │
         │ returns
         │
┌──────────────────────┐
│ SchemaValidator      │
├──────────────────────┤
│ + validateSchemaFormat()│
│ - validateDatasourceConfig()│
│ - validateInteractionConfig()│
│ - isSupportedComponentType()│
└──────────────────────┘
```

### 2.4 功能点3：Schema版本处理

#### 详细描述

**功能说明**：识别schema版本，如果版本不匹配，应用版本转换器将旧版本schema转换为当前版本。

**算法流程**：

```
1. 读取schema中的version字段
2. 获取当前系统支持的schema版本（如"2.0"）
3. 比较schema版本和当前版本：
   a. 如果版本相同：直接返回schema
   b. 如果版本不同：
      - 查找版本转换器（VersionConverter）
      - 应用转换器将schema转换为当前版本
      - 更新schema的version字段
4. 返回转换后的schema（JSON对象）
```

**函数伪代码**：

```java
/**
 * 处理Schema版本兼容性
 * @param schemaJson Schema JSON对象
 * @return 转换后的Schema JSON对象
 */
public JSONObject processSchemaVersion(JSONObject schemaJson) {
    // 1. 读取schema版本
    String schemaVersion = schemaJson.getString("version");
    if (StringUtils.isBlank(schemaVersion)) {
        schemaVersion = "1.0"; // 默认版本
    }
    
    // 2. 获取当前系统支持的版本
    String currentVersion = getCurrentSchemaVersion(); // 如"2.0"
    
    // 3. 如果版本相同，直接返回
    if (schemaVersion.equals(currentVersion)) {
        return schemaJson;
    }
    
    // 4. 查找版本转换器
    VersionConverter converter = versionConverterRegistry.getConverter(
        schemaVersion, currentVersion);
    
    if (converter == null) {
        throw new BusinessException(
            "不支持从版本 " + schemaVersion + " 转换到版本 " + currentVersion);
    }
    
    // 5. 应用转换器
    JSONObject convertedSchema = converter.convert(schemaJson);
    
    // 6. 更新版本号
    convertedSchema.put("version", currentVersion);
    
    return convertedSchema;
}

/**
 * 获取当前系统支持的Schema版本
 */
private String getCurrentSchemaVersion() {
    return "2.0"; // 从配置中读取
}
```

**对象类图**：

```
┌──────────────────────┐
│ VersionConverter     │
├──────────────────────┤
│ + convert(schema)    │
└──────────────────────┘
         ▲
         │ implements
         │
┌──────────────────────┐
│ V1ToV2Converter      │
├──────────────────────┤
│ + convert()          │
└──────────────────────┘
         │
         │ uses
         │
┌──────────────────────┐
│ VersionConverterRegistry│
├──────────────────────┤
│ + getConverter()     │
│ - converters: Map     │
└──────────────────────┘
```

### 2.5 功能点4：组件树构建

#### 详细描述

**功能说明**：根据schema中的组件配置递归构建组件树结构，支持嵌套组件和组件层级关系。

**算法流程**：

```
1. 从schema中读取components数组
2. 构建组件映射表（componentId -> component）：
   a. 遍历所有组件，建立ID到组件的映射
3. 构建组件树：
   a. 识别根组件（parentId为空或不存在）
   b. 为每个根组件递归构建子树：
      - 查找子组件（parentId等于当前组件ID）
      - 递归构建子组件的子树
      - 将子组件添加到当前组件的children数组
4. 返回组件树结构
```

**函数伪代码**：

```java
/**
 * 构建组件树
 * @param schemaJson Schema JSON对象
 * @return 组件树根节点列表
 */
public List<ComponentNode> buildComponentTree(JSONObject schemaJson) {
    // 1. 读取components数组
    JSONArray componentsArray = schemaJson.getJSONArray("components");
    if (componentsArray == null || componentsArray.isEmpty()) {
        return Collections.emptyList();
    }
    
    // 2. 构建组件映射表
    Map<String, ComponentNode> componentMap = new HashMap<>();
    for (int i = 0; i < componentsArray.size(); i++) {
        JSONObject componentJson = componentsArray.getJSONObject(i);
        ComponentNode node = convertToComponentNode(componentJson);
        componentMap.put(node.getComponentId(), node);
    }
    
    // 3. 构建组件树
    List<ComponentNode> rootNodes = new ArrayList<>();
    for (ComponentNode node : componentMap.values()) {
        String parentId = node.getParentId();
        if (StringUtils.isBlank(parentId) || !componentMap.containsKey(parentId)) {
            // 根组件
            rootNodes.add(node);
        } else {
            // 子组件，添加到父组件的children
            ComponentNode parent = componentMap.get(parentId);
            if (parent.getChildren() == null) {
                parent.setChildren(new ArrayList<>());
            }
            parent.getChildren().add(node);
        }
    }
    
    // 4. 递归构建子树（处理嵌套层级）
    for (ComponentNode rootNode : rootNodes) {
        buildSubTree(rootNode, componentMap);
    }
    
    return rootNodes;
}

/**
 * 递归构建子树
 */
private void buildSubTree(ComponentNode node, Map<String, ComponentNode> componentMap) {
    if (node.getChildren() == null || node.getChildren().isEmpty()) {
        return;
    }
    
    for (ComponentNode child : node.getChildren()) {
        // 查找子组件的子组件
        List<ComponentNode> grandChildren = componentMap.values().stream()
            .filter(c -> child.getComponentId().equals(c.getParentId()))
            .collect(Collectors.toList());
        
        if (!grandChildren.isEmpty()) {
            if (child.getChildren() == null) {
                child.setChildren(new ArrayList<>());
            }
            child.getChildren().addAll(grandChildren);
            // 递归处理
            for (ComponentNode grandChild : grandChildren) {
                buildSubTree(grandChild, componentMap);
            }
        }
    }
}

/**
 * 将JSON对象转换为ComponentNode
 */
private ComponentNode convertToComponentNode(JSONObject componentJson) {
    ComponentNode node = new ComponentNode();
    node.setComponentId(componentJson.getString("componentId"));
    node.setComponentType(componentJson.getString("componentType"));
    node.setParentId(componentJson.getString("parentId"));
    node.setProps(componentJson.getJSONObject("props"));
    node.setStyle(componentJson.getJSONObject("style"));
    node.setDataSource(componentJson.getJSONObject("dataSource"));
    node.setInteractions(componentJson.getJSONArray("interactions"));
    return node;
}
```

**对象类图**：

```
┌──────────────────────┐
│   ComponentNode      │
├──────────────────────┤
│ + componentId        │
│ + componentType      │
│ + parentId           │
│ + props              │
│ + style              │
│ + dataSource         │
│ + interactions       │
│ + children: List<ComponentNode>│
└──────────────────────┘
         │
         │ uses
         │
┌──────────────────────┐
│ ComponentTreeBuilder │
├──────────────────────┤
│ + buildComponentTree()│
│ - buildSubTree()     │
│ - convertToComponentNode()│
└──────────────────────┘
```

### 2.6 功能点5：数据源配置提取

#### 详细描述

**功能说明**：从schema中提取数据源连接信息和查询配置，构建数据源配置映射表。

**算法流程**：

```
1. 从schema中读取datasources字段
2. 判断datasources类型：
   - 如果是对象：转换为数组处理
   - 如果是数组：直接处理
3. 遍历数据源配置：
   a. 提取数据源ID（datasourceId）
   b. 提取数据源类型（datasourceType）
   c. 提取连接配置（connectionConfig）
   d. 提取查询配置（queryConfig）
   e. 构建数据源配置对象
4. 构建数据源映射表（datasourceId -> datasourceConfig）
5. 返回数据源配置映射表
```

**函数伪代码**：

```java
/**
 * 提取数据源配置
 * @param schemaJson Schema JSON对象
 * @return 数据源配置映射表
 */
public Map<String, DatasourceConfig> extractDatasourceConfig(JSONObject schemaJson) {
    Map<String, DatasourceConfig> datasourceMap = new HashMap<>();
    
    // 1. 读取datasources字段
    if (!schemaJson.containsKey("datasources")) {
        return datasourceMap;
    }
    
    Object datasourcesObj = schemaJson.get("datasources");
    JSONArray datasourcesArray;
    
    // 2. 判断类型并转换为数组
    if (datasourcesObj instanceof JSONObject) {
        JSONObject datasourcesObj2 = (JSONObject) datasourcesObj;
        datasourcesArray = new JSONArray();
        for (String key : datasourcesObj2.keySet()) {
            JSONObject ds = datasourcesObj2.getJSONObject(key);
            ds.put("datasourceId", key); // 如果对象中没有datasourceId，使用key
            datasourcesArray.add(ds);
        }
    } else if (datasourcesObj instanceof JSONArray) {
        datasourcesArray = (JSONArray) datasourcesObj;
    } else {
        return datasourceMap;
    }
    
    // 3. 遍历数据源配置
    for (int i = 0; i < datasourcesArray.size(); i++) {
        JSONObject dsJson = datasourcesArray.getJSONObject(i);
        
        // 4. 提取数据源信息
        String datasourceId = dsJson.getString("datasourceId");
        if (StringUtils.isBlank(datasourceId)) {
            continue; // 跳过无效配置
        }
        
        DatasourceConfig config = new DatasourceConfig();
        config.setDatasourceId(datasourceId);
        config.setDatasourceType(dsJson.getString("datasourceType"));
        config.setConnectionConfig(dsJson.getJSONObject("connectionConfig"));
        config.setQueryConfig(dsJson.getJSONObject("queryConfig"));
        config.setCredentials(dsJson.getJSONObject("credentials"));
        
        // 5. 添加到映射表
        datasourceMap.put(datasourceId, config);
    }
    
    return datasourceMap;
}
```

**对象类图**：

```
┌──────────────────────┐
│ DatasourceConfig     │
├──────────────────────┤
│ + datasourceId       │
│ + datasourceType     │
│ + connectionConfig   │
│ + queryConfig        │
│ + credentials        │
└──────────────────────┘
         ▲
         │
         │ creates
         │
┌──────────────────────┐
│ DatasourceExtractor  │
├──────────────────────┤
│ + extractDatasourceConfig()│
└──────────────────────┘
```

### 2.7 功能点6：交互配置提取

#### 详细描述

**功能说明**：从schema中提取交互规则配置，包括下钻、关联、跳转、过滤、动态事件等交互类型。

**算法流程**：

```
1. 从schema中读取interactions字段
2. 判断interactions类型：
   - 如果是对象：转换为数组处理
   - 如果是数组：直接处理
3. 遍历交互配置：
   a. 提取交互ID（interactionId）
   b. 提取交互类型（interactionType）
   c. 提取交互配置（interactionConfig）：
      - 下钻配置：drillDownConfig
      - 关联配置：associationConfig
      - 跳转配置：jumpConfig
      - 过滤配置：filterConfig
      - 动态事件配置：dynamicEventConfig
   d. 构建交互配置对象
4. 构建交互映射表（interactionId -> interactionConfig）
5. 同时构建组件到交互的映射（componentId -> List<interactionConfig>）
6. 返回交互配置映射表
```

**函数伪代码**：

```java
/**
 * 提取交互配置
 * @param schemaJson Schema JSON对象
 * @return 交互配置映射表
 */
public Map<String, InteractionConfig> extractInteractionConfig(JSONObject schemaJson) {
    Map<String, InteractionConfig> interactionMap = new HashMap<>();
    
    // 1. 从schema中读取interactions字段
    if (!schemaJson.containsKey("interactions")) {
        return interactionMap;
    }
    
    Object interactionsObj = schemaJson.get("interactions");
    JSONArray interactionsArray;
    
    // 2. 判断类型并转换为数组
    if (interactionsObj instanceof JSONObject) {
        JSONObject interactionsObj2 = (JSONObject) interactionsObj;
        interactionsArray = new JSONArray();
        for (String key : interactionsObj2.keySet()) {
            JSONObject interaction = interactionsObj2.getJSONObject(key);
            interaction.put("interactionId", key);
            interactionsArray.add(interaction);
        }
    } else if (interactionsObj instanceof JSONArray) {
        interactionsArray = (JSONArray) interactionsObj;
    } else {
        return interactionMap;
    }
    
    // 3. 遍历交互配置
    for (int i = 0; i < interactionsArray.size(); i++) {
        JSONObject interactionJson = interactionsArray.getJSONObject(i);
        
        // 4. 提取交互信息
        String interactionId = interactionJson.getString("interactionId");
        if (StringUtils.isBlank(interactionId)) {
            continue;
        }
        
        InteractionConfig config = new InteractionConfig();
        config.setInteractionId(interactionId);
        config.setInteractionType(interactionJson.getString("interactionType"));
        config.setComponentId(interactionJson.getString("componentId"));
        config.setEventType(interactionJson.getString("eventType"));
        
        // 5. 根据交互类型提取具体配置
        String interactionType = config.getInteractionType();
        switch (interactionType) {
            case "drillDown":
                config.setDrillDownConfig(interactionJson.getJSONObject("drillDownConfig"));
                break;
            case "association":
                config.setAssociationConfig(interactionJson.getJSONObject("associationConfig"));
                break;
            case "jump":
                config.setJumpConfig(interactionJson.getJSONObject("jumpConfig"));
                break;
            case "filter":
                config.setFilterConfig(interactionJson.getJSONObject("filterConfig"));
                break;
            case "dynamicEvent":
                config.setDynamicEventConfig(interactionJson.getJSONObject("dynamicEventConfig"));
                break;
            default:
                log.warn("未知的交互类型: " + interactionType);
        }
        
        // 6. 添加到映射表
        interactionMap.put(interactionId, config);
    }
    
    return interactionMap;
}
```

**对象类图**：

```
┌──────────────────────┐
│ InteractionConfig    │
├──────────────────────┤
│ + interactionId      │
│ + interactionType    │
│ + componentId        │
│ + eventType          │
│ + drillDownConfig    │
│ + associationConfig  │
│ + jumpConfig         │
│ + filterConfig       │
│ + dynamicEventConfig │
└──────────────────────┘
         ▲
         │
         │ creates
         │
┌──────────────────────┐
│ InteractionExtractor │
├──────────────────────┤
│ + extractInteractionConfig()│
└──────────────────────┘
```

### 2.8 功能点7：解析结果缓存

#### 详细描述

**功能说明**：缓存schema解析结果，避免重复解析，提高性能。支持缓存过期和失效机制。

**算法流程**：

```
1. 接收报表ID和解析结果
2. 构建缓存键（reportId + schemaVersion）
3. 检查缓存：
   a. 如果缓存命中：直接返回缓存结果
   b. 如果缓存未命中：执行解析，然后缓存结果
4. 设置缓存过期时间（如30分钟）
5. 当schema更新时，清除对应缓存
```

**函数伪代码**：

```java
/**
 * 获取或解析Schema（带缓存）
 * @param reportId 报表ID
 * @return 解析结果
 */
public SchemaParseResult parseSchemaWithCache(String reportId) {
    // 1. 获取报表信息（包含版本号）
    Report report = reportMapper.selectById(reportId);
    if (report == null) {
        throw new NotFoundException("报表不存在: " + reportId);
    }
    
    // 2. 构建缓存键
    String cacheKey = buildCacheKey(reportId, report.getSchemaVersion());
    
    // 3. 检查缓存
    SchemaParseResult cachedResult = cacheService.get(cacheKey, SchemaParseResult.class);
    if (cachedResult != null) {
        return cachedResult;
    }
    
    // 4. 缓存未命中，执行解析
    SchemaParseResult result = parseSchema(reportId);
    
    // 5. 缓存结果（30分钟过期）
    cacheService.put(cacheKey, result, 30, TimeUnit.MINUTES);
    
    return result;
}

/**
 * 构建缓存键
 */
private String buildCacheKey(String reportId, String schemaVersion) {
    return "schema:parse:" + reportId + ":" + schemaVersion;
}

/**
 * 清除Schema解析缓存
 */
public void clearSchemaCache(String reportId) {
    Report report = reportMapper.selectById(reportId);
    if (report != null) {
        String cacheKey = buildCacheKey(reportId, report.getSchemaVersion());
        cacheService.delete(cacheKey);
    }
}
```

**对象类图**：

```
┌──────────────────────┐
│ SchemaParseResult    │
├──────────────────────┤
│ + reportInfo         │
│ + componentTree      │
│ + datasourceMap      │
│ + interactionMap     │
│ + parseTime          │
└──────────────────────┘
         ▲
         │
         │ returns
         │
┌──────────────────────┐
│ SchemaParser         │
├──────────────────────┤
│ + parseSchemaWithCache()│
│ + clearSchemaCache() │
│ - buildCacheKey()    │
└──────────────────────┘
         │
         │ uses
         │
┌──────────────────────┐
│ CacheService         │
├──────────────────────┤
│ + get()              │
│ + put()              │
│ + delete()           │
└──────────────────────┘
```

### 2.9 功能点8：错误处理

#### 详细描述

**功能说明**：在schema解析过程中提供详细的错误信息和错误定位，帮助快速定位和修复问题。

**算法流程**：

```
1. 捕获解析过程中的异常
2. 根据异常类型分类处理：
   a. JSON格式错误：提供JSON解析错误位置和原因
   b. Schema结构错误：提供缺失字段、类型错误等信息
   c. 版本不兼容错误：提供当前版本和需要的版本信息
   d. 组件配置错误：提供组件ID和具体错误信息
   e. 数据源配置错误：提供数据源ID和具体错误信息
   f. 交互配置错误：提供交互ID和具体错误信息
3. 构建详细的错误信息对象：
   - 错误类型
   - 错误消息
   - 错误位置（字段路径、行号等）
   - 错误建议（如何修复）
4. 记录错误日志
5. 返回错误信息或抛出异常
```

**函数伪代码**：

```java
/**
 * 解析Schema（主入口）
 * @param reportId 报表ID
 * @return 解析结果
 */
public SchemaParseResult parseSchema(String reportId) {
    try {
        // 1. 加载Schema文件
        String schemaContent = loadSchema(reportId);
        
        // 2. 验证Schema格式
        ValidationResult validation = validateSchemaFormat(schemaContent);
        if (!validation.isValid()) {
            throw new SchemaValidationException("Schema格式验证失败", validation.getErrors());
        }
        
        // 3. 解析JSON
        JSONObject schemaJson = JSON.parseObject(schemaContent);
        
        // 4. 处理版本兼容性
        schemaJson = processSchemaVersion(schemaJson);
        
        // 5. 构建组件树
        List<ComponentNode> componentTree = buildComponentTree(schemaJson);
        
        // 6. 提取数据源配置
        Map<String, DatasourceConfig> datasourceMap = extractDatasourceConfig(schemaJson);
        
        // 7. 提取交互配置
        Map<String, InteractionConfig> interactionMap = extractInteractionConfig(schemaJson);
        
        // 8. 构建解析结果
        SchemaParseResult result = new SchemaParseResult();
        result.setReportInfo(schemaJson.getJSONObject("reportInfo"));
        result.setComponentTree(componentTree);
        result.setDatasourceMap(datasourceMap);
        result.setInteractionMap(interactionMap);
        result.setParseTime(new Date());
        
        return result;
        
    } catch (SchemaValidationException e) {
        // Schema验证错误
        handleSchemaValidationError(reportId, e);
        throw e;
    } catch (JSONException e) {
        // JSON解析错误
        handleJSONParseError(reportId, e);
        throw new SchemaParseException("JSON解析失败", e);
    } catch (BusinessException e) {
        // 业务异常
        handleBusinessError(reportId, e);
        throw e;
    } catch (Exception e) {
        // 其他未知异常
        handleUnknownError(reportId, e);
        throw new SchemaParseException("Schema解析失败", e);
    }
}

/**
 * 处理Schema验证错误
 */
private void handleSchemaValidationError(String reportId, SchemaValidationException e) {
    ErrorInfo errorInfo = new ErrorInfo();
    errorInfo.setErrorType("SCHEMA_VALIDATION_ERROR");
    errorInfo.setReportId(reportId);
    errorInfo.setErrorMessage("Schema格式验证失败");
    errorInfo.setErrorDetails(e.getErrors());
    errorInfo.setTimestamp(new Date());
    
    log.error("Schema验证失败: reportId={}, errors={}", reportId, e.getErrors(), e);
    errorReporter.report(errorInfo);
}

/**
 * 处理JSON解析错误
 */
private void handleJSONParseError(String reportId, JSONException e) {
    ErrorInfo errorInfo = new ErrorInfo();
    errorInfo.setErrorType("JSON_PARSE_ERROR");
    errorInfo.setReportId(reportId);
    errorInfo.setErrorMessage("JSON格式错误: " + e.getMessage());
    errorInfo.setErrorPosition(extractErrorPosition(e));
    errorInfo.setTimestamp(new Date());
    
    log.error("JSON解析失败: reportId={}", reportId, e);
    errorReporter.report(errorInfo);
}

/**
 * 提取错误位置信息
 */
private String extractErrorPosition(JSONException e) {
    // 从异常消息中提取行号和列号
    String message = e.getMessage();
    if (message != null && message.contains("line")) {
        return message;
    }
    return "未知位置";
}

/**
 * 处理业务错误
 */
private void handleBusinessError(String reportId, BusinessException e) {
    ErrorInfo errorInfo = new ErrorInfo();
    errorInfo.setErrorType("BUSINESS_ERROR");
    errorInfo.setReportId(reportId);
    errorInfo.setErrorMessage(e.getMessage());
    errorInfo.setTimestamp(new Date());
    
    log.error("业务错误: reportId={}, message={}", reportId, e.getMessage(), e);
    errorReporter.report(errorInfo);
}

/**
 * 处理未知错误
 */
private void handleUnknownError(String reportId, Exception e) {
    ErrorInfo errorInfo = new ErrorInfo();
    errorInfo.setErrorType("UNKNOWN_ERROR");
    errorInfo.setReportId(reportId);
    errorInfo.setErrorMessage("未知错误: " + e.getMessage());
    errorInfo.setTimestamp(new Date());
    
    log.error("Schema解析未知错误: reportId={}", reportId, e);
    errorReporter.report(errorInfo);
}
```

**对象类图**：

```
┌──────────────────────┐
│   ErrorInfo          │
├──────────────────────┤
│ + errorType          │
│ + reportId           │
│ + errorMessage       │
│ + errorDetails       │
│ + errorPosition      │
│ + timestamp          │
└──────────────────────┘
         ▲
         │
         │ creates
         │
┌──────────────────────┐
│ SchemaParser         │
├──────────────────────┤
│ + parseSchema()      │
│ - handleSchemaValidationError()│
│ - handleJSONParseError()│
│ - handleBusinessError()│
│ - handleUnknownError()│
│ - extractErrorPosition()│
└──────────────────────┘
         │
         │ uses
         │
┌──────────────────────┐
│ ErrorReporter        │
├──────────────────────┤
│ + report()           │
└──────────────────────┘
```

## 3 AR开发者测试设计

### 3.1 测试用例设计原则

1. **测试覆盖**：覆盖所有功能点的正常流程、异常流程和边界条件
2. **测试对象**：主要测试Service层的方法，包括：
   - SchemaParser的各个方法
   - SchemaLoader的加载方法
   - SchemaValidator的验证方法
   - ComponentTreeBuilder的构建方法
   - DatasourceExtractor的提取方法
   - InteractionExtractor的提取方法
3. **测试场景**：包括主场景、分支场景和异常场景
4. **测试因子**：包括schema格式、版本号、组件类型、数据源类型、交互类型等

### 3.2 测试用例列表

#### 3.2.1 Schema文件加载测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-SP-001 | 从数据库BYTEA字段加载Schema | SchemaLoader.loadSchema() | 报表存在，schema存储在数据库 | 成功加载Schema内容 |
| TC-SP-002 | 从文件系统加载Schema | SchemaLoader.loadSchema() | 报表存在，schema存储在文件系统 | 成功加载Schema内容 |
| TC-SP-003 | 从对象存储加载Schema | SchemaLoader.loadSchema() | 报表存在，schema存储在对象存储 | 成功加载Schema内容 |
| TC-SP-004 | 报表不存在 | SchemaLoader.loadSchema() | 报表ID不存在 | 抛出NotFoundException |
| TC-SP-005 | Schema文件不存在 | SchemaLoader.loadSchema() | 报表存在，但schema文件路径无效 | 抛出BusinessException |
| TC-SP-006 | 文件读取失败 | SchemaLoader.loadSchema() | 文件系统权限不足或文件损坏 | 抛出BusinessException |

#### 3.2.2 Schema格式验证测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-SP-007 | 正常验证有效Schema | SchemaValidator.validateSchemaFormat() | Schema格式完整正确 | 验证通过，返回valid=true |
| TC-SP-008 | JSON格式错误 | SchemaValidator.validateSchemaFormat() | JSON字符串格式错误 | 验证失败，返回JSON格式错误 |
| TC-SP-009 | 缺少必需字段version | SchemaValidator.validateSchemaFormat() | Schema缺少version字段 | 验证失败，返回缺少字段错误 |
| TC-SP-010 | 缺少必需字段reportInfo | SchemaValidator.validateSchemaFormat() | Schema缺少reportInfo字段 | 验证失败，返回缺少字段错误 |
| TC-SP-011 | 缺少必需字段components | SchemaValidator.validateSchemaFormat() | Schema缺少components字段 | 验证失败，返回缺少字段错误 |
| TC-SP-012 | 字段类型错误 | SchemaValidator.validateSchemaFormat() | version字段不是字符串类型 | 验证失败，返回类型错误 |
| TC-SP-013 | 组件缺少componentId | SchemaValidator.validateSchemaFormat() | 组件配置缺少componentId | 验证失败，返回组件错误 |
| TC-SP-014 | 组件缺少componentType | SchemaValidator.validateSchemaFormat() | 组件配置缺少componentType | 验证失败，返回组件错误 |
| TC-SP-015 | 不支持的组件类型 | SchemaValidator.validateSchemaFormat() | 组件类型不在支持列表中 | 验证失败，返回不支持类型错误 |
| TC-SP-016 | 数据源配置错误 | SchemaValidator.validateSchemaFormat() | 数据源配置缺少datasourceId | 验证失败，返回数据源错误 |
| TC-SP-017 | 交互配置错误 | SchemaValidator.validateSchemaFormat() | 交互配置缺少interactionId | 验证失败，返回交互错误 |

#### 3.2.3 Schema版本处理测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-SP-018 | 版本相同无需转换 | SchemaParser.processSchemaVersion() | Schema版本与当前版本相同 | 直接返回Schema，不进行转换 |
| TC-SP-019 | 版本不同需要转换 | SchemaParser.processSchemaVersion() | Schema版本为1.0，当前版本为2.0 | 应用转换器，返回转换后的Schema |
| TC-SP-020 | 版本号为空使用默认版本 | SchemaParser.processSchemaVersion() | Schema缺少version字段 | 使用默认版本1.0 |
| TC-SP-021 | 不支持的版本转换 | SchemaParser.processSchemaVersion() | 从版本1.0转换到版本3.0，但无转换器 | 抛出BusinessException |
| TC-SP-022 | 版本转换器执行失败 | SchemaParser.processSchemaVersion() | 转换器执行时抛出异常 | 抛出BusinessException |

#### 3.2.4 组件树构建测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-SP-023 | 构建单层组件树 | ComponentTreeBuilder.buildComponentTree() | Schema包含多个根组件，无嵌套 | 成功构建组件树，返回根组件列表 |
| TC-SP-024 | 构建多层嵌套组件树 | ComponentTreeBuilder.buildComponentTree() | Schema包含嵌套组件 | 成功构建层级组件树 |
| TC-SP-025 | 空组件列表 | ComponentTreeBuilder.buildComponentTree() | Schema的components为空数组 | 返回空列表 |
| TC-SP-026 | 组件parentId无效 | ComponentTreeBuilder.buildComponentTree() | 组件的parentId指向不存在的组件 | 将该组件作为根组件处理 |
| TC-SP-027 | 循环引用检测 | ComponentTreeBuilder.buildComponentTree() | 组件A的parentId指向组件B，组件B的parentId指向组件A | 检测到循环引用，抛出异常或忽略 |

#### 3.2.5 数据源配置提取测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-SP-028 | 提取数据源配置（对象格式） | DatasourceExtractor.extractDatasourceConfig() | datasources为对象格式 | 成功提取数据源配置映射表 |
| TC-SP-029 | 提取数据源配置（数组格式） | DatasourceExtractor.extractDatasourceConfig() | datasources为数组格式 | 成功提取数据源配置映射表 |
| TC-SP-030 | Schema无数据源配置 | DatasourceExtractor.extractDatasourceConfig() | Schema不包含datasources字段 | 返回空映射表 |
| TC-SP-031 | 数据源缺少datasourceId | DatasourceExtractor.extractDatasourceConfig() | 数据源配置缺少datasourceId | 跳过该数据源配置 |
| TC-SP-032 | 数据源类型不完整 | DatasourceExtractor.extractDatasourceConfig() | 数据源配置缺少datasourceType | 提取其他字段，datasourceType为null |

#### 3.2.6 交互配置提取测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-SP-033 | 提取交互配置（对象格式） | InteractionExtractor.extractInteractionConfig() | interactions为对象格式 | 成功提取交互配置映射表 |
| TC-SP-034 | 提取交互配置（数组格式） | InteractionExtractor.extractInteractionConfig() | interactions为数组格式 | 成功提取交互配置映射表 |
| TC-SP-035 | Schema无交互配置 | InteractionExtractor.extractInteractionConfig() | Schema不包含interactions字段 | 返回空映射表 |
| TC-SP-036 | 提取下钻交互配置 | InteractionExtractor.extractInteractionConfig() | 交互类型为drillDown | 成功提取drillDownConfig |
| TC-SP-037 | 提取关联交互配置 | InteractionExtractor.extractInteractionConfig() | 交互类型为association | 成功提取associationConfig |
| TC-SP-038 | 提取跳转交互配置 | InteractionExtractor.extractInteractionConfig() | 交互类型为jump | 成功提取jumpConfig |
| TC-SP-039 | 提取过滤交互配置 | InteractionExtractor.extractInteractionConfig() | 交互类型为filter | 成功提取filterConfig |
| TC-SP-040 | 提取动态事件交互配置 | InteractionExtractor.extractInteractionConfig() | 交互类型为dynamicEvent | 成功提取dynamicEventConfig |
| TC-SP-041 | 未知交互类型 | InteractionExtractor.extractInteractionConfig() | 交互类型不在支持列表中 | 记录警告日志，跳过该交互配置 |

#### 3.2.7 解析结果缓存测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-SP-042 | 缓存命中返回缓存结果 | SchemaParser.parseSchemaWithCache() | 缓存中存在解析结果 | 直接返回缓存结果，不执行解析 |
| TC-SP-043 | 缓存未命中执行解析 | SchemaParser.parseSchemaWithCache() | 缓存中不存在解析结果 | 执行解析并缓存结果 |
| TC-SP-044 | 缓存过期重新解析 | SchemaParser.parseSchemaWithCache() | 缓存已过期 | 重新执行解析并更新缓存 |
| TC-SP-045 | 清除指定报表缓存 | SchemaParser.clearSchemaCache() | 报表ID存在 | 成功清除对应缓存 |
| TC-SP-046 | 清除不存在报表缓存 | SchemaParser.clearSchemaCache() | 报表ID不存在 | 不抛出异常，静默处理 |

#### 3.2.8 Schema解析主流程测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-SP-047 | 完整解析流程成功 | SchemaParser.parseSchema() | Schema格式完整正确 | 成功返回解析结果，包含所有配置 |
| TC-SP-048 | Schema验证失败 | SchemaParser.parseSchema() | Schema格式验证失败 | 抛出SchemaValidationException |
| TC-SP-049 | JSON解析失败 | SchemaParser.parseSchema() | JSON格式错误 | 抛出SchemaParseException |
| TC-SP-050 | 版本转换失败 | SchemaParser.parseSchema() | 版本转换器执行失败 | 抛出BusinessException |
| TC-SP-051 | 组件树构建失败 | SchemaParser.parseSchema() | 组件配置错误导致构建失败 | 抛出SchemaParseException |
| TC-SP-052 | 解析结果包含所有必需字段 | SchemaParser.parseSchema() | Schema解析成功 | 解析结果包含reportInfo、componentTree、datasourceMap、interactionMap |

#### 3.2.9 错误处理测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-SP-053 | Schema验证错误处理 | SchemaParser.parseSchema() | Schema验证失败 | 记录错误日志，抛出SchemaValidationException |
| TC-SP-054 | JSON解析错误处理 | SchemaParser.parseSchema() | JSON解析失败 | 记录错误日志，抛出SchemaParseException |
| TC-SP-055 | 业务错误处理 | SchemaParser.parseSchema() | 业务逻辑异常 | 记录错误日志，抛出BusinessException |
| TC-SP-056 | 未知错误处理 | SchemaParser.parseSchema() | 未知异常 | 记录错误日志，抛出SchemaParseException |
| TC-SP-057 | 错误信息包含详细信息 | SchemaParser.parseSchema() | 解析过程中发生错误 | 错误信息包含错误类型、位置、建议等 |

### 3.3 测试用例实现说明

1. **测试框架**：使用JUnit 4 + Mockito进行单元测试
2. **Mock对象**：需要Mock以下依赖：
   - ReportMapper：模拟数据库操作
   - StorageService：模拟文件存储服务
   - CacheService：模拟缓存服务
   - VersionConverterRegistry：模拟版本转换器注册表
   - ErrorReporter：模拟错误报告服务
3. **测试数据准备**：
   - 准备有效的Schema JSON字符串
   - 准备各种格式错误的Schema JSON字符串
   - 准备不同版本的Schema JSON字符串
   - 使用测试数据构建器（TestDataBuilder）创建测试对象
4. **断言验证**：
   - 验证方法返回值
   - 验证异常抛出
   - 验证缓存操作
   - 验证错误日志记录
5. **测试隔离**：每个测试用例独立，使用@Before和@After进行数据清理

### 3.4 测试覆盖率要求

- **语句覆盖率**：≥ 80%
- **分支覆盖率**：≥ 75%
- **方法覆盖率**：≥ 90%
- **核心方法覆盖率**：≥ 95%

### 3.5 测试数据示例

**有效Schema示例**：
```json
{
  "version": "2.0",
  "reportInfo": {
    "reportId": "report-001",
    "reportName": "销售报表",
    "reportType": "report"
  },
  "components": [
    {
      "componentId": "comp-001",
      "componentType": "barChart",
      "props": {
        "title": "销售趋势"
      }
    }
  ],
  "datasources": {
    "ds-001": {
      "datasourceId": "ds-001",
      "datasourceType": "postgresql",
      "connectionConfig": {}
    }
  },
  "interactions": [
    {
      "interactionId": "inter-001",
      "interactionType": "drillDown",
      "componentId": "comp-001",
      "drillDownConfig": {}
    }
  ]
}
```

**无效Schema示例（缺少必需字段）**：
```json
{
  "reportInfo": {
    "reportId": "report-001"
  }
}
```

**无效Schema示例（JSON格式错误）**：
```json
{
  "version": "2.0",
  "reportInfo": {
    "reportId": "report-001",
    "reportName": "销售报表"
  }
  "components": []
}
```