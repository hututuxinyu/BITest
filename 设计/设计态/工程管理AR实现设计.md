## 1 需求重述

### 1.2 需求背景

设计态系统是报表BI（商业智能）系统的核心设计环境，负责提供可视化的BI设计界面。用户登录系统后，需要首先进入工程管理界面，可以创建个人工程或选择已有工程。工程管理模块是设计态系统的核心入口模块，为用户提供工程空间管理能力，支持从Codehub个人分支导入Schema文件，实现版本控制和协作开发。

### 1.3 需求功能介绍

工程管理模块提供以下核心功能：

1. **工程列表展示**：显示当前用户的所有个人工程，包括工程名称、描述、创建时间、报表数量、工程类型等信息
2. **创建工程**：用户可以创建新的个人工程，输入工程名称、描述和工程类型（私有工程/公共工程），支持从Codehub个人分支导入全量Schema文件
3. **选择工程**：用户可以从工程列表中选择已有工程，点击进入报表编辑界面
4. **编辑工程**：用户可以编辑工程的基本信息（工程名称、描述、工程类型）
5. **删除工程**：用户可以删除工程及其下的所有报表，删除操作需要二次确认
6. **导入模型**：用户可以导入模型文件，支持从Codehub个人分支导入Schema文件
7. **导出模型**：用户可以导出当前工程的所有模型文件
8. **提交Git**：用户可以将修改后的Schema文件提交到Codehub个人分支
9. **工程搜索**：支持按工程名称搜索工程
10. **工程排序**：支持按工程名称、创建时间等字段排序

## 2 功能实现分析

### 2.1 功能点清单

1. **工程列表查询**：获取当前用户的工程列表，支持分页、搜索、排序
2. **创建工程**：创建个人工程，支持从Codehub导入Schema
3. **更新工程**：更新工程的基本信息
4. **删除工程**：删除工程及其关联数据
5. **进入工程**：验证工程权限，跳转到报表编辑界面
6. **导入模型**：从Codehub个人分支导入Schema文件
7. **导出模型**：导出工程下的所有Schema文件
8. **提交Git**：将工程下的Schema文件提交到Codehub个人分支
9. **工程统计**：获取工程的统计信息（报表数量、最后更新时间等）

### 2.2 功能点1：工程列表查询

#### 详细描述

**功能说明**：获取当前用户的工程列表，支持分页、搜索、排序功能。

**数据库表**：

**工程表（project）**：
```sql
CREATE TABLE project (
    project_id VARCHAR(64) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(20) NOT NULL DEFAULT 'private', -- private: 私有工程, public: 公共工程
    user_id VARCHAR(64) NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    report_count INT DEFAULT 0,
    last_report_update_time TIMESTAMP,
    codehub_repository VARCHAR(255),
    codehub_branch VARCHAR(255),
    codehub_path VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- active: 活跃, deleted: 已删除
    CONSTRAINT fk_project_user FOREIGN KEY (user_id) REFERENCES user(user_id)
);

CREATE INDEX idx_project_user_id ON project(user_id);
CREATE INDEX idx_project_create_time ON project(create_time);
CREATE INDEX idx_project_project_name ON project(project_name);
```

**算法流程**：

```
1. 获取当前登录用户ID
2. 验证用户身份（通过JWT Token或Session）
3. 构建查询条件：
   - WHERE user_id = current_user_id
   - WHERE status = 'active'
   - 如果提供搜索关键词，添加：project_name LIKE '%keyword%'
4. 根据排序参数排序（默认按创建时间倒序）
5. 分页查询：
   - LIMIT pageSize OFFSET (pageNum - 1) * pageSize
6. 统计总记录数
7. 查询每个工程的报表数量（关联查询report表）
8. 返回工程列表和分页信息
```

**函数伪代码**：

```java
/**
 * 获取用户的工程列表
 * @param userId 用户ID
 * @param pageNum 页码（从1开始）
 * @param pageSize 每页大小
 * @param keyword 搜索关键词（可选）
 * @param sortField 排序字段（可选，默认createTime）
 * @param sortOrder 排序方向（可选，默认DESC）
 * @return 工程列表和分页信息
 */
public PageResult<ProjectVO> getProjectList(String userId, Integer pageNum, Integer pageSize, 
                                             String keyword, String sortField, String sortOrder) {
    // 1. 验证用户身份
    User currentUser = userService.getCurrentUser();
    if (currentUser == null || !currentUser.getUserId().equals(userId)) {
        throw new UnauthorizedException("用户未登录或无权访问");
    }
    
    // 2. 构建查询条件
    ProjectQuery query = new ProjectQuery();
    query.setUserId(userId);
    query.setStatus("active");
    if (StringUtils.isNotBlank(keyword)) {
        query.setProjectNameLike("%" + keyword + "%");
    }
    
    // 3. 设置排序
    if (StringUtils.isBlank(sortField)) {
        sortField = "createTime";
    }
    if (StringUtils.isBlank(sortOrder)) {
        sortOrder = "DESC";
    }
    query.setSortField(sortField);
    query.setSortOrder(sortOrder);
    
    // 4. 分页查询
    PageHelper.startPage(pageNum, pageSize);
    List<Project> projects = projectMapper.selectByQuery(query);
    PageInfo<Project> pageInfo = new PageInfo<>(projects);
    
    // 5. 查询每个工程的报表数量
    List<ProjectVO> projectVOs = projects.stream().map(project -> {
        ProjectVO vo = convertToVO(project);
        int reportCount = reportMapper.countByProjectId(project.getProjectId());
        vo.setReportCount(reportCount);
        return vo;
    }).collect(Collectors.toList());
    
    // 6. 构建分页结果
    PageResult<ProjectVO> result = new PageResult<>();
    result.setList(projectVOs);
    result.setTotal(pageInfo.getTotal());
    result.setPageNum(pageNum);
    result.setPageSize(pageSize);
    result.setTotalPages(pageInfo.getPages());
    
    return result;
}
```

**对象类图**：

```
┌─────────────────┐
│   ProjectVO     │
├─────────────────┤
│ + projectId     │
│ + projectName   │
│ + description   │
│ + projectType   │
│ + createTime    │
│ + updateTime    │
│ + reportCount   │
│ + lastReportUpdateTime│
└─────────────────┘
         ▲
         │
┌─────────────────┐
│   Project       │
├─────────────────┤
│ + projectId     │
│ + projectName   │
│ + description   │
│ + projectType   │
│ + userId        │
│ + createTime    │
│ + updateTime    │
│ + reportCount   │
│ + codehubRepository│
│ + codehubBranch │
│ + codehubPath   │
│ + status        │
└─────────────────┘
         │
         │ 1
         │
┌─────────────────┐
│      User       │
├─────────────────┤
│ + userId        │
│ + username      │
└─────────────────┘
```

### 2.3 功能点2：创建工程

#### 详细描述

**功能说明**：创建个人工程，支持从Codehub个人分支导入全量Schema文件。

**数据库表**：使用工程表（project），见功能点1。

**算法流程**：

```
1. 验证用户身份
2. 验证工程名称是否为空
3. 验证工程名称是否重复（同一用户下）
4. 创建工程记录：
   - 生成工程ID（UUID）
   - 设置工程基本信息
   - 设置创建时间和更新时间
   - 设置工程类型（私有工程/公共工程）
5. 如果选择从Codehub导入：
   a. 验证Codehub配置是否完整
   b. 调用Codehub集成模块获取Schema文件列表
   c. 批量导入Schema文件：
      - 从Codehub下载Schema文件
      - 验证Schema格式
      - 解析Schema文件
      - 创建报表记录
      - 关联到工程
   d. 更新工程的Codehub配置信息
   e. 更新工程的报表数量
6. 保存工程记录到数据库
7. 返回工程信息（包含导入的报表数量）
```

**函数伪代码**：

```java
/**
 * 创建个人工程
 * @param request 创建工程请求
 * @return 工程信息
 */
public ProjectVO createProject(CreateProjectRequest request) {
    // 1. 验证用户身份
    User currentUser = userService.getCurrentUser();
    if (currentUser == null) {
        throw new UnauthorizedException("用户未登录");
    }
    
    // 2. 验证工程名称
    if (StringUtils.isBlank(request.getProjectName())) {
        throw new IllegalArgumentException("工程名称不能为空");
    }
    
    // 3. 验证工程名称是否重复
    Project existingProject = projectMapper.selectByUserIdAndName(
        currentUser.getUserId(), request.getProjectName());
    if (existingProject != null) {
        throw new BusinessException("工程名称已存在");
    }
    
    // 4. 创建工程记录
    Project project = new Project();
    project.setProjectId(UUID.randomUUID().toString());
    project.setProjectName(request.getProjectName());
    project.setDescription(request.getDescription());
    project.setProjectType(request.getProjectType() != null ? 
                          request.getProjectType() : "private");
    project.setUserId(currentUser.getUserId());
    project.setCreateTime(new Date());
    project.setUpdateTime(new Date());
    project.setStatus("active");
    project.setReportCount(0);
    
    // 5. 如果选择从Codehub导入
    int importedCount = 0;
    if (request.isImportFromCodehub() && request.getCodehubConfig() != null) {
        CodehubConfig codehubConfig = request.getCodehubConfig();
        
        // 验证Codehub配置
        validateCodehubConfig(codehubConfig);
        
        // 保存Codehub配置信息
        project.setCodehubRepository(codehubConfig.getRepository());
        project.setCodehubBranch(codehubConfig.getBranch());
        project.setCodehubPath(codehubConfig.getPath());
        
        // 调用Codehub集成模块导入全量Schema
        try {
            ImportResult importResult = codehubService.importAllSchemas(
                currentUser.getUserId(),
                codehubConfig.getRepository(),
                codehubConfig.getBranch(),
                project.getProjectId(),
                codehubConfig.getPath()
            );
            importedCount = importResult.getImportedCount();
            project.setReportCount(importedCount);
            
            // 更新最后报表更新时间
            if (importedCount > 0) {
                project.setLastReportUpdateTime(new Date());
            }
        } catch (Exception e) {
            // 导入失败，记录日志，但不影响工程创建
            log.error("从Codehub导入Schema失败", e);
            // 可以选择抛出异常或继续创建工程（允许稍后重新导入）
        }
    }
    
    // 6. 保存工程记录
    projectMapper.insert(project);
    
    // 7. 转换为VO并返回
    ProjectVO vo = convertToVO(project);
    vo.setReportCount(importedCount);
    
    return vo;
}

/**
 * 验证Codehub配置
 */
private void validateCodehubConfig(CodehubConfig config) {
    if (StringUtils.isBlank(config.getRepository())) {
        throw new IllegalArgumentException("Codehub仓库不能为空");
    }
    if (StringUtils.isBlank(config.getBranch())) {
        throw new IllegalArgumentException("Codehub分支不能为空");
    }
}
```

**对象类图**：

```
┌──────────────────────┐
│ CreateProjectRequest │
├──────────────────────┤
│ + projectName        │
│ + description        │
│ + projectType        │
│ + importFromCodehub  │
│ + codehubConfig      │
└──────────────────────┘
         │
         │ uses
         │
┌──────────────────────┐
│   CodehubConfig      │
├──────────────────────┤
│ + repository         │
│ + branch            │
│ + path              │
└──────────────────────┘
         │
         │ uses
         │
┌──────────────────────┐
│   ProjectService     │
├──────────────────────┤
│ + createProject()    │
│ + getProjectList()   │
│ + updateProject()    │
│ + deleteProject()    │
└──────────────────────┘
         │
         │ uses
         │
┌──────────────────────┐
│  CodehubService      │
├──────────────────────┤
│ + importAllSchemas() │
│ + getRepositories()  │
│ + getBranches()      │
└──────────────────────┘
```

### 2.4 功能点3：更新工程

#### 详细描述

**功能说明**：更新工程的基本信息（工程名称、描述、工程类型）。

**数据库表**：使用工程表（project），见功能点1。

**算法流程**：

```
1. 验证用户身份
2. 根据工程ID查询工程记录
3. 验证工程是否属于当前用户
4. 验证工程状态是否为active
5. 如果更新工程名称，验证新名称是否重复
6. 更新工程信息：
   - 更新工程名称（如果提供）
   - 更新工程描述（如果提供）
   - 更新工程类型（如果提供）
   - 更新updateTime
7. 保存到数据库
8. 返回更新后的工程信息
```

**函数伪代码**：

```java
/**
 * 更新工程信息
 * @param projectId 工程ID
 * @param request 更新请求
 * @return 更新后的工程信息
 */
public ProjectVO updateProject(String projectId, UpdateProjectRequest request) {
    // 1. 验证用户身份
    User currentUser = userService.getCurrentUser();
    if (currentUser == null) {
        throw new UnauthorizedException("用户未登录");
    }
    
    // 2. 查询工程记录
    Project project = projectMapper.selectById(projectId);
    if (project == null) {
        throw new NotFoundException("工程不存在");
    }
    
    // 3. 验证工程是否属于当前用户
    if (!project.getUserId().equals(currentUser.getUserId())) {
        throw new ForbiddenException("无权访问该工程");
    }
    
    // 4. 验证工程状态
    if (!"active".equals(project.getStatus())) {
        throw new BusinessException("工程已删除，无法更新");
    }
    
    // 5. 如果更新工程名称，验证是否重复
    if (StringUtils.isNotBlank(request.getProjectName()) && 
        !request.getProjectName().equals(project.getProjectName())) {
        Project existingProject = projectMapper.selectByUserIdAndName(
            currentUser.getUserId(), request.getProjectName());
        if (existingProject != null && !existingProject.getProjectId().equals(projectId)) {
            throw new BusinessException("工程名称已存在");
        }
        project.setProjectName(request.getProjectName());
    }
    
    // 6. 更新工程信息
    if (StringUtils.isNotBlank(request.getDescription())) {
        project.setDescription(request.getDescription());
    }
    if (StringUtils.isNotBlank(request.getProjectType())) {
        project.setProjectType(request.getProjectType());
    }
    project.setUpdateTime(new Date());
    
    // 7. 保存到数据库
    projectMapper.updateById(project);
    
    // 8. 转换为VO并返回
    return convertToVO(project);
}
```

### 2.5 功能点4：删除工程

#### 详细描述

**功能说明**：删除工程及其关联数据（报表、Schema文件等），支持软删除。

**数据库表**：使用工程表（project）和报表表（report）。

**算法流程**：

```
1. 验证用户身份
2. 根据工程ID查询工程记录
3. 验证工程是否属于当前用户
4. 查询工程下的所有报表
5. 删除工程及其关联数据：
   a. 删除工程下的所有报表（软删除或物理删除）
   b. 删除工程记录（软删除：设置status='deleted'，或物理删除）
6. 记录删除操作日志
7. 返回删除结果
```

**函数伪代码**：

```java
/**
 * 删除工程
 * @param projectId 工程ID
 * @return 删除结果
 */
public void deleteProject(String projectId) {
    // 1. 验证用户身份
    User currentUser = userService.getCurrentUser();
    if (currentUser == null) {
        throw new UnauthorizedException("用户未登录");
    }
    
    // 2. 查询工程记录
    Project project = projectMapper.selectById(projectId);
    if (project == null) {
        throw new NotFoundException("工程不存在");
    }
    
    // 3. 验证工程是否属于当前用户
    if (!project.getUserId().equals(currentUser.getUserId())) {
        throw new ForbiddenException("无权删除该工程");
    }
    
    // 4. 查询工程下的所有报表
    List<Report> reports = reportMapper.selectByProjectId(projectId);
    
    // 5. 删除工程及其关联数据（使用事务）
    transactionTemplate.execute(status -> {
        // 删除报表（软删除）
        for (Report report : reports) {
            report.setStatus("deleted");
            report.setUpdateTime(new Date());
            reportMapper.updateById(report);
        }
        
        // 删除工程（软删除）
        project.setStatus("deleted");
        project.setUpdateTime(new Date());
        projectMapper.updateById(project);
        
        // 记录删除操作日志
        operationLogService.logDeleteProject(currentUser.getUserId(), projectId);
        
        return null;
    });
}
```

### 2.6 功能点5：进入工程

#### 详细描述

**功能说明**：验证工程权限，跳转到报表编辑界面。

**算法流程**：

```
1. 验证用户身份
2. 根据工程ID查询工程记录
3. 验证工程是否属于当前用户
4. 验证工程状态是否为active
5. 返回工程信息（用于前端路由跳转）
```

**函数伪代码**：

```java
/**
 * 进入工程
 * @param projectId 工程ID
 * @return 工程信息
 */
public ProjectVO enterProject(String projectId) {
    // 1. 验证用户身份
    User currentUser = userService.getCurrentUser();
    if (currentUser == null) {
        throw new UnauthorizedException("用户未登录");
    }
    
    // 2. 查询工程记录
    Project project = projectMapper.selectById(projectId);
    if (project == null) {
        throw new NotFoundException("工程不存在");
    }
    
    // 3. 验证工程是否属于当前用户
    if (!project.getUserId().equals(currentUser.getUserId())) {
        throw new ForbiddenException("无权访问该工程");
    }
    
    // 4. 验证工程状态
    if (!"active".equals(project.getStatus())) {
        throw new BusinessException("工程已删除，无法访问");
    }
    
    // 5. 转换为VO并返回
    return convertToVO(project);
}
```

### 2.7 功能点6：导入模型

#### 详细描述

**功能说明**：从Codehub个人分支导入Schema文件到工程中。

**算法流程**：

```
1. 验证用户身份
2. 验证工程是否属于当前用户
3. 获取Codehub配置
4. 调用Codehub集成模块：
   a. 获取Codehub仓库列表
   b. 获取指定仓库的分支列表
   c. 获取指定分支下的Schema文件列表
   d. 用户选择要导入的文件（或全量导入）
   e. 从Codehub下载Schema文件
   f. 验证Schema格式
   g. 解析Schema文件
   h. 创建报表记录
   i. 关联到工程
5. 更新工程的报表数量
6. 更新工程的最后报表更新时间
7. 返回导入结果
```

**函数伪代码**：

```java
/**
 * 导入模型
 * @param projectId 工程ID
 * @param request 导入请求
 * @return 导入结果
 */
public ImportResult importModels(String projectId, ImportModelRequest request) {
    // 1. 验证用户身份
    User currentUser = userService.getCurrentUser();
    if (currentUser == null) {
        throw new UnauthorizedException("用户未登录");
    }
    
    // 2. 验证工程是否属于当前用户
    Project project = projectMapper.selectById(projectId);
    if (project == null || !project.getUserId().equals(currentUser.getUserId())) {
        throw new ForbiddenException("无权访问该工程");
    }
    
    // 3. 获取Codehub配置
    CodehubConfig codehubConfig = codehubService.getCodehubConfig(currentUser.getUserId());
    if (codehubConfig == null) {
        throw new BusinessException("请先配置Codehub账号");
    }
    
    // 4. 调用Codehub集成模块导入Schema
    ImportResult result = codehubService.importSchemas(
        currentUser.getUserId(),
        request.getRepository() != null ? request.getRepository() : codehubConfig.getRepository(),
        request.getBranch() != null ? request.getBranch() : codehubConfig.getDefaultBranch(),
        projectId,
        request.getFilePaths() // 如果为空，则导入全量
    );
    
    // 5. 更新工程的报表数量
    int currentReportCount = reportMapper.countByProjectId(projectId);
    project.setReportCount(currentReportCount);
    project.setLastReportUpdateTime(new Date());
    project.setUpdateTime(new Date());
    projectMapper.updateById(project);
    
    return result;
}
```

### 2.8 功能点7：导出模型

#### 详细描述

**功能说明**：导出工程下的所有Schema文件。

**算法流程**：

```
1. 验证用户身份
2. 验证工程是否属于当前用户
3. 查询工程下的所有报表
4. 获取每个报表的Schema文件内容
5. 打包所有Schema文件（ZIP格式）
6. 返回文件流供下载
```

**函数伪代码**：

```java
/**
 * 导出模型
 * @param projectId 工程ID
 * @return 文件流
 */
public InputStream exportModels(String projectId) {
    // 1. 验证用户身份
    User currentUser = userService.getCurrentUser();
    if (currentUser == null) {
        throw new UnauthorizedException("用户未登录");
    }
    
    // 2. 验证工程是否属于当前用户
    Project project = projectMapper.selectById(projectId);
    if (project == null || !project.getUserId().equals(currentUser.getUserId())) {
        throw new ForbiddenException("无权访问该工程");
    }
    
    // 3. 查询工程下的所有报表
    List<Report> reports = reportMapper.selectByProjectId(projectId);
    
    // 4. 创建ZIP文件
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (ZipOutputStream zos = new ZipOutputStream(baos)) {
        for (Report report : reports) {
            // 获取Schema文件内容
            String schemaContent = storageService.getSchema(report.getReportId());
            
            // 添加到ZIP
            ZipEntry entry = new ZipEntry(report.getReportName() + ".json");
            zos.putNextEntry(entry);
            zos.write(schemaContent.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
    } catch (IOException e) {
        throw new BusinessException("导出失败", e);
    }
    
    // 5. 返回文件流
    return new ByteArrayInputStream(baos.toByteArray());
}
```

### 2.9 功能点8：提交Git

#### 详细描述

**功能说明**：将工程下的Schema文件提交到Codehub个人分支。

**算法流程**：

```
1. 验证用户身份
2. 验证工程是否属于当前用户
3. 获取Codehub配置
4. 查询工程下的所有报表
5. 对每个报表：
   a. 获取Schema文件内容
   b. 调用Codehub集成模块提交到个人分支
6. 返回提交结果
```

**函数伪代码**：

```java
/**
 * 提交到Git
 * @param projectId 工程ID
 * @param request 提交请求
 * @return 提交结果
 */
public CommitResult commitToGit(String projectId, CommitGitRequest request) {
    // 1. 验证用户身份
    User currentUser = userService.getCurrentUser();
    if (currentUser == null) {
        throw new UnauthorizedException("用户未登录");
    }
    
    // 2. 验证工程是否属于当前用户
    Project project = projectMapper.selectById(projectId);
    if (project == null || !project.getUserId().equals(currentUser.getUserId())) {
        throw new ForbiddenException("无权访问该工程");
    }
    
    // 3. 获取Codehub配置
    CodehubConfig codehubConfig = codehubService.getCodehubConfig(currentUser.getUserId());
    if (codehubConfig == null) {
        throw new BusinessException("请先配置Codehub账号");
    }
    
    // 4. 查询工程下的所有报表
    List<Report> reports = reportMapper.selectByProjectId(projectId);
    
    // 5. 提交所有报表的Schema文件
    List<CommitInfo> commitInfos = new ArrayList<>();
    for (Report report : reports) {
        // 获取Schema文件内容
        String schemaContent = storageService.getSchema(report.getReportId());
        
        // 构建文件路径
        String filePath = (codehubConfig.getPath() != null ? codehubConfig.getPath() + "/" : "") 
                         + report.getReportName() + ".json";
        
        // 调用Codehub集成模块提交
        CommitInfo commitInfo = codehubService.commitSchema(
            currentUser.getUserId(),
            codehubConfig.getRepository(),
            codehubConfig.getDefaultBranch(),
            filePath,
            schemaContent,
            request.getCommitMessage() != null ? request.getCommitMessage() : 
                "更新报表: " + report.getReportName()
        );
        commitInfos.add(commitInfo);
    }
    
    // 6. 返回提交结果
    CommitResult result = new CommitResult();
    result.setSuccess(true);
    result.setCommitCount(commitInfos.size());
    result.setCommitInfos(commitInfos);
    
    return result;
}
```

### 2.10 功能点9：工程统计

#### 详细描述

**功能说明**：获取工程的统计信息（报表数量、最后更新时间等）。

**算法流程**：

```
1. 验证用户身份
2. 验证工程是否属于当前用户
3. 查询工程的报表数量
4. 查询工程的最后报表更新时间
5. 返回统计信息
```

**函数伪代码**：

```java
/**
 * 获取工程统计信息
 * @param projectId 工程ID
 * @return 统计信息
 */
public ProjectStatistics getProjectStatistics(String projectId) {
    // 1. 验证用户身份
    User currentUser = userService.getCurrentUser();
    if (currentUser == null) {
        throw new UnauthorizedException("用户未登录");
    }
    
    // 2. 验证工程是否属于当前用户
    Project project = projectMapper.selectById(projectId);
    if (project == null || !project.getUserId().equals(currentUser.getUserId())) {
        throw new ForbiddenException("无权访问该工程");
    }
    
    // 3. 查询统计信息
    ProjectStatistics statistics = new ProjectStatistics();
    statistics.setProjectId(projectId);
    statistics.setReportCount(reportMapper.countByProjectId(projectId));
    statistics.setLastReportUpdateTime(project.getLastReportUpdateTime());
    statistics.setCreateTime(project.getCreateTime());
    statistics.setUpdateTime(project.getUpdateTime());
    
    return statistics;
}
```

## 3 AR开发者测试设计

### 3.1 测试用例设计原则

1. **测试覆盖**：覆盖所有功能点的正常流程、异常流程和边界条件
2. **测试对象**：主要测试Service层的方法，包括：
   - ProjectService的各个方法
   - 与CodehubService的集成
   - 与StorageService的集成
3. **测试场景**：包括主场景、分支场景和异常场景
4. **测试因子**：包括用户权限、工程状态、Codehub配置状态、数据完整性等

### 3.2 测试用例列表

#### 3.2.1 工程列表查询测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-PM-001 | 正常查询工程列表 | ProjectService.getProjectList() | 用户已登录，有多个工程 | 返回工程列表，包含分页信息 |
| TC-PM-002 | 查询空工程列表 | ProjectService.getProjectList() | 用户已登录，无工程 | 返回空列表 |
| TC-PM-003 | 带搜索关键词查询 | ProjectService.getProjectList() | 用户已登录，提供搜索关键词 | 返回匹配的工程列表 |
| TC-PM-004 | 分页查询 | ProjectService.getProjectList() | 用户已登录，提供分页参数 | 返回指定页的数据 |
| TC-PM-005 | 排序查询 | ProjectService.getProjectList() | 用户已登录，提供排序参数 | 返回按指定字段排序的列表 |
| TC-PM-006 | 用户未登录 | ProjectService.getProjectList() | 用户未登录 | 抛出UnauthorizedException |

#### 3.2.2 创建工程测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-PM-007 | 正常创建工程 | ProjectService.createProject() | 用户已登录，提供有效工程信息 | 创建成功，返回工程信息 |
| TC-PM-008 | 工程名称为空 | ProjectService.createProject() | 用户已登录，工程名称为空 | 抛出IllegalArgumentException |
| TC-PM-009 | 工程名称重复 | ProjectService.createProject() | 用户已登录，工程名称已存在 | 抛出BusinessException |
| TC-PM-010 | 从Codehub导入成功 | ProjectService.createProject() | 用户已登录，选择从Codehub导入，配置有效 | 创建成功，导入Schema文件，返回导入数量 |
| TC-PM-011 | 从Codehub导入失败 | ProjectService.createProject() | 用户已登录，选择从Codehub导入，配置无效 | 创建成功，但导入失败，记录错误日志 |
| TC-PM-012 | Codehub配置不完整 | ProjectService.createProject() | 用户已登录，选择从Codehub导入，配置不完整 | 抛出IllegalArgumentException |
| TC-PM-013 | 用户未登录 | ProjectService.createProject() | 用户未登录 | 抛出UnauthorizedException |

#### 3.2.3 更新工程测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-PM-014 | 正常更新工程 | ProjectService.updateProject() | 用户已登录，工程属于用户 | 更新成功，返回更新后的工程信息 |
| TC-PM-015 | 工程不存在 | ProjectService.updateProject() | 用户已登录，工程ID不存在 | 抛出NotFoundException |
| TC-PM-016 | 工程不属于用户 | ProjectService.updateProject() | 用户已登录，工程属于其他用户 | 抛出ForbiddenException |
| TC-PM-017 | 工程已删除 | ProjectService.updateProject() | 用户已登录，工程状态为deleted | 抛出BusinessException |
| TC-PM-018 | 更新后工程名称重复 | ProjectService.updateProject() | 用户已登录，新工程名称已存在 | 抛出BusinessException |
| TC-PM-019 | 用户未登录 | ProjectService.updateProject() | 用户未登录 | 抛出UnauthorizedException |

#### 3.2.4 删除工程测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-PM-020 | 正常删除工程 | ProjectService.deleteProject() | 用户已登录，工程属于用户，有报表 | 删除成功，工程和报表状态为deleted |
| TC-PM-021 | 删除空工程 | ProjectService.deleteProject() | 用户已登录，工程属于用户，无报表 | 删除成功，工程状态为deleted |
| TC-PM-022 | 工程不存在 | ProjectService.deleteProject() | 用户已登录，工程ID不存在 | 抛出NotFoundException |
| TC-PM-023 | 工程不属于用户 | ProjectService.deleteProject() | 用户已登录，工程属于其他用户 | 抛出ForbiddenException |
| TC-PM-024 | 用户未登录 | ProjectService.deleteProject() | 用户未登录 | 抛出UnauthorizedException |

#### 3.2.5 进入工程测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-PM-025 | 正常进入工程 | ProjectService.enterProject() | 用户已登录，工程属于用户 | 返回工程信息 |
| TC-PM-026 | 工程不存在 | ProjectService.enterProject() | 用户已登录，工程ID不存在 | 抛出NotFoundException |
| TC-PM-027 | 工程不属于用户 | ProjectService.enterProject() | 用户已登录，工程属于其他用户 | 抛出ForbiddenException |
| TC-PM-028 | 工程已删除 | ProjectService.enterProject() | 用户已登录，工程状态为deleted | 抛出BusinessException |
| TC-PM-029 | 用户未登录 | ProjectService.enterProject() | 用户未登录 | 抛出UnauthorizedException |

#### 3.2.6 导入模型测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-PM-030 | 正常导入模型 | ProjectService.importModels() | 用户已登录，工程属于用户，Codehub配置有效 | 导入成功，返回导入结果 |
| TC-PM-031 | Codehub配置不存在 | ProjectService.importModels() | 用户已登录，工程属于用户，Codehub配置不存在 | 抛出BusinessException |
| TC-PM-032 | Codehub导入失败 | ProjectService.importModels() | 用户已登录，工程属于用户，Codehub连接失败 | 抛出BusinessException |
| TC-PM-033 | 工程不属于用户 | ProjectService.importModels() | 用户已登录，工程属于其他用户 | 抛出ForbiddenException |
| TC-PM-034 | 用户未登录 | ProjectService.importModels() | 用户未登录 | 抛出UnauthorizedException |

#### 3.2.7 导出模型测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-PM-035 | 正常导出模型 | ProjectService.exportModels() | 用户已登录，工程属于用户，有报表 | 返回ZIP文件流 |
| TC-PM-036 | 导出空工程 | ProjectService.exportModels() | 用户已登录，工程属于用户，无报表 | 返回空的ZIP文件 |
| TC-PM-037 | 工程不属于用户 | ProjectService.exportModels() | 用户已登录，工程属于其他用户 | 抛出ForbiddenException |
| TC-PM-038 | 用户未登录 | ProjectService.exportModels() | 用户未登录 | 抛出UnauthorizedException |

#### 3.2.8 提交Git测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-PM-039 | 正常提交到Git | ProjectService.commitToGit() | 用户已登录，工程属于用户，Codehub配置有效 | 提交成功，返回提交结果 |
| TC-PM-040 | Codehub配置不存在 | ProjectService.commitToGit() | 用户已登录，工程属于用户，Codehub配置不存在 | 抛出BusinessException |
| TC-PM-041 | Codehub提交失败 | ProjectService.commitToGit() | 用户已登录，工程属于用户，Codehub提交失败 | 抛出BusinessException |
| TC-PM-042 | 工程不属于用户 | ProjectService.commitToGit() | 用户已登录，工程属于其他用户 | 抛出ForbiddenException |
| TC-PM-043 | 用户未登录 | ProjectService.commitToGit() | 用户未登录 | 抛出UnauthorizedException |

#### 3.2.9 工程统计测试用例

| 用例ID | 测试场景 | 被测对象 | 测试因子 | 预期结果 |
|--------|---------|---------|---------|---------|
| TC-PM-044 | 正常获取统计信息 | ProjectService.getProjectStatistics() | 用户已登录，工程属于用户 | 返回统计信息 |
| TC-PM-045 | 工程不存在 | ProjectService.getProjectStatistics() | 用户已登录，工程ID不存在 | 抛出NotFoundException |
| TC-PM-046 | 工程不属于用户 | ProjectService.getProjectStatistics() | 用户已登录，工程属于其他用户 | 抛出ForbiddenException |
| TC-PM-047 | 用户未登录 | ProjectService.getProjectStatistics() | 用户未登录 | 抛出UnauthorizedException |

### 3.3 测试用例实现说明

1. **测试框架**：使用JUnit 4 + Mockito进行单元测试
2. **Mock对象**：需要Mock以下依赖：
   - UserService：模拟用户认证
   - ProjectMapper：模拟数据库操作
   - ReportMapper：模拟报表查询
   - CodehubService：模拟Codehub集成
   - StorageService：模拟存储服务
   - OperationLogService：模拟操作日志
3. **测试数据准备**：使用测试数据构建器（TestDataBuilder）创建测试对象
4. **断言验证**：验证方法返回值、异常抛出、数据库操作等
5. **测试隔离**：每个测试用例独立，使用@Before和@After进行数据清理

### 3.4 测试覆盖率要求

- **语句覆盖率**：≥ 80%
- **分支覆盖率**：≥ 75%
- **方法覆盖率**：≥ 90%
- **核心方法覆盖率**：≥ 95%

