# BI系统 - 设计态服务

## 项目概述

这是一个BI（商业智能）系统的设计态服务，提供工程管理功能。项目采用前后端分离架构，后端使用Spring Boot，前端使用React + TypeScript。

## 技术栈

### 后端
- Spring Boot 2.7.18
- PostgreSQL
- JPA/Hibernate
- JUnit 4 + Mockito

### 前端
- React 18
- TypeScript
- Ant Design 5.x
- Vite
- Axios

## 项目结构

```
BIService/
├── backend/                    # 后端Spring Boot项目
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/biservice/
│   │   │   │   ├── entity/     # 实体类
│   │   │   │   ├── repository/ # 数据访问层
│   │   │   │   ├── service/    # 业务逻辑层
│   │   │   │   ├── controller/ # 控制器层
│   │   │   │   └── dto/        # 数据传输对象
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/               # 测试代码
│   └── pom.xml
├── frontend/                   # 前端React项目
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API服务
│   │   ├── types/             # TypeScript类型定义
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── database/                    # 数据库脚本
│   └── init.sql
└── 设计/                       # 设计文档
```

## 功能模块

### 已实现功能

1. **用户认证模块**
   - 用户登录
   - 获取当前用户信息

2. **工程管理模块**
   - 工程列表查询（支持分页、搜索、排序）
   - 创建工程
   - 更新工程
   - 删除工程
   - 进入工程

## 快速开始

### 前置要求

- JDK 1.8+
- Maven 3.6+
- Node.js 16+
- PostgreSQL 12+

### 数据库初始化

1. 创建PostgreSQL数据库：
```sql
CREATE DATABASE biservice;
```

2. 执行初始化脚本：
```bash
psql -U postgres -d biservice -f database/init.sql
```

### 后端启动

1. 进入后端目录：
```bash
cd backend
```

2. 修改 `src/main/resources/application.yml` 中的数据库配置

3. 启动应用：
```bash
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动

### 前端启动

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动

## 测试账号

- 用户名：`admin`
- 密码：`admin123`

## API接口

### 用户接口

- `POST /api/user/login` - 用户登录
- `GET /api/user/current` - 获取当前用户信息

### 工程接口

- `GET /api/projects` - 获取工程列表
- `POST /api/projects` - 创建工程
- `PUT /api/projects/{projectId}` - 更新工程
- `DELETE /api/projects/{projectId}` - 删除工程
- `POST /api/projects/{projectId}/enter` - 进入工程

## 开发规范

- 函数不超过50行
- 文件不超过200行
- 遵循RESTful API设计规范
- 使用JUnit 4 + Mockito进行单元测试
- 代码需要添加Javadoc注释

## 后续计划

按照AR粒度拆分，后续将实现以下模块：

1. 模板管理模块
2. 组件库模块
3. 画布编辑模块
4. 属性配置模块
5. 数据源配置模块
6. 交互配置模块
7. Schema生成模块
8. Codehub集成模块
9. 国际化模块

## 许可证

MIT License
