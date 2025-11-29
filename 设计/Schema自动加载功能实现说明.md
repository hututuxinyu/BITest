# Schema自动加载功能实现说明

## 功能概述
实现了点击报表后自动加载Schema到画布的功能。当用户进入报表编辑界面时，系统会自动读取报表的Schema文件，解析并渲染到画布上。

## 实现时间
2025-11-29

## 后端实现

### 1. ReportController.java
**新增接口**: `GET /api/reports/project/{projectId}/{reportId}/schema`

**功能说明**:
- 验证报表是否存在
- 读取Schema文件内容
- 解析JSON并返回Schema对象

**代码实现**:
```java
@GetMapping("/project/{projectId}/{reportId}/schema")
public ApiResponse<Map<String, Object>> getReportSchema(
        @PathVariable String projectId,
        @PathVariable String reportId) {
    try {
        // 验证报表是否存在
        ReportVO report = reportService.getReportDetail(projectId, reportId);
        
        // 读取Schema
        String schemaJson = schemaService.readSchema(reportId);
        
        // 解析JSON并返回
        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> schema = objectMapper.readValue(schemaJson, Map.class);
        
        return ApiResponse.success(schema);
    } catch (Exception e) {
        return ApiResponse.error("获取Schema失败: " + e.getMessage());
    }
}
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "reportId": "report-001",
    "reportName": "报表名称",
    "components": [...],
    ...
  }
}
```

## 前端实现

### 1. api.ts
**新增方法**: `getReportSchema(projectId: string, reportId: string)`

**功能说明**:
- 调用后端API获取Schema JSON
- 返回解析后的Schema对象

### 2. CanvasEditor.tsx

#### 2.1 组件类型映射
**函数**: `mapComponentTypeToId(componentType: string)`

**功能说明**:
- 将Schema中的`componentType`（如`barChart`）映射到组件库中的`componentId`（如`chart-bar`）
- 支持多种组件类型映射

**映射表**:
```typescript
{
  barChart: 'chart-bar',
  lineChart: 'chart-line',
  pieChart: 'chart-pie',
  table: 'chart-table',
  gauge: 'chart-gauge',
  image: 'media-image',
  video: 'media-video',
  text: 'media-text',
  button: 'control-button',
  filter: 'control-filter',
  input: 'control-input',
}
```

#### 2.2 Schema解析函数
**函数**: `loadSchemaToCanvas(schema: any)`

**功能说明**:
- 解析Schema JSON，提取components数组
- 将每个Schema组件转换为CanvasItem
- 异步加载组件定义
- 设置组件位置、大小、属性等
- 更新画布和历史记录

**解析流程**:
1. 验证Schema格式（检查components数组）
2. 获取所有组件列表，建立componentId映射
3. 遍历Schema中的components：
   - 跳过不可见组件（visible === false）
   - 映射componentType到componentId
   - 查找对应的ComponentSummary
   - 创建CanvasItem（包含位置、大小、属性等）
   - 异步加载ComponentDefinition
4. 设置画布项到state
5. 更新历史记录
6. 显示成功提示

#### 2.3 自动加载useEffect
**位置**: CanvasEditor组件中

**触发条件**:
- `projectId`存在
- `reportId`存在
- `reportContext`已加载
- `canvasItems.length === 0`（避免重复加载）

**执行流程**:
1. 调用`reportApi.getReportSchema()`获取Schema
2. 如果成功，调用`loadSchemaToCanvas()`解析并加载
3. 如果失败或Schema为空，静默处理（可能是新报表）

**代码实现**:
```typescript
useEffect(() => {
  if (projectId && reportId && reportContext && canvasItems.length === 0) {
    reportApi
      .getReportSchema(projectId, reportId)
      .then((response) => {
        if (response.success && response.data) {
          loadSchemaToCanvas(response.data);
        } else {
          console.log('报表Schema为空或不存在，将显示空白画布');
        }
      })
      .catch((error) => {
        console.log('加载Schema失败（可能是新报表）:', error);
      });
  }
}, [projectId, reportId, reportContext, canvasItems.length, loadSchemaToCanvas]);
```

## 功能特性

### 1. 自动加载
- 进入报表编辑界面时自动加载Schema
- 无需手动操作

### 2. 智能映射
- 自动将Schema中的componentType映射到组件库中的componentId
- 支持多种组件类型

### 3. 异步加载
- 组件定义异步加载，不阻塞界面
- 显示加载状态

### 4. 错误处理
- Schema不存在时静默处理（新报表场景）
- 组件找不到时跳过并警告
- 加载失败时显示错误提示

### 5. 状态管理
- 自动更新画布状态
- 更新历史记录（支持撤销/重做）
- 保持组件属性、位置、大小等信息

## 数据流转

```
用户点击报表
    ↓
进入报表编辑界面
    ↓
加载报表基本信息 (reportContext)
    ↓
检测到画布为空
    ↓
调用 getReportSchema API
    ↓
后端读取Schema文件
    ↓
返回Schema JSON
    ↓
解析Schema components
    ↓
映射componentType到componentId
    ↓
查找ComponentSummary
    ↓
创建CanvasItem数组
    ↓
异步加载ComponentDefinition
    ↓
更新画布状态
    ↓
渲染组件到画布
```

## Schema格式要求

Schema必须包含以下字段：
- `components`: 组件数组（必需）
- 每个组件必须包含：
  - `componentId`: 组件ID
  - `componentType`: 组件类型（如barChart、lineChart等）
  - `position`: 位置 {x, y}
  - `size`: 大小 {width, height}
  - `props`: 组件属性（可选）
  - `datasourceConfig`: 数据源配置（可选）
  - `visible`: 是否可见（可选，默认true）

## 组件类型映射

| Schema中的componentType | 组件库中的componentId | 说明 |
|------------------------|----------------------|------|
| barChart | chart-bar | 柱状图 |
| lineChart | chart-line | 折线图 |
| pieChart | chart-pie | 饼图 |
| table | chart-table | 表格 |
| gauge | chart-gauge | 仪表盘 |
| image | media-image | 图片 |
| video | media-video | 视频 |
| text | media-text | 文本 |
| button | control-button | 按钮 |
| filter | control-filter | 筛选器 |
| input | control-input | 输入框 |

## 测试场景

### 1. 正常加载
- 有Schema的报表：自动加载并显示组件
- 无Schema的报表：显示空白画布（新报表）

### 2. 组件映射
- 支持的组件类型：正确映射并加载
- 不支持的组件类型：跳过并警告

### 3. 错误处理
- Schema文件不存在：静默处理
- Schema格式错误：显示错误提示
- 组件定义加载失败：显示错误状态

### 4. 性能
- 多个组件：异步加载，不阻塞界面
- 大Schema：分批加载或优化

## 注意事项

1. **避免重复加载**: 使用`canvasItems.length === 0`判断，确保只加载一次
2. **组件映射**: 如果Schema中的componentType不在映射表中，会使用原值查找，可能找不到组件
3. **异步加载**: 组件定义是异步加载的，初始状态为loading
4. **错误处理**: Schema不存在时不显示错误，因为可能是新报表
5. **历史记录**: 加载Schema后会自动添加到历史记录，支持撤销操作

## 后续优化建议

1. **组件映射扩展**: 支持更多组件类型映射
2. **加载进度**: 显示Schema加载进度
3. **缓存机制**: 缓存已加载的Schema，避免重复请求
4. **批量加载**: 优化多个组件的加载性能
5. **错误恢复**: 部分组件加载失败时的恢复机制

## 相关文件

### 后端文件
- `backend/src/main/java/com/biservice/controller/ReportController.java`
- `backend/src/main/java/com/biservice/service/SchemaService.java`

### 前端文件
- `frontend/src/services/api.ts`
- `frontend/src/pages/CanvasEditor.tsx`

---

**实现完成**: ✅ 前后端功能已完整实现

