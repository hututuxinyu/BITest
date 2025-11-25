/**
 * 用户信息类型
 */
export interface User {
  userId: string;
  username: string;
  email?: string;
  status: string;
  lastLoginTime?: string;
}

/**
 * 工程信息类型
 */
export interface Project {
  projectId: string;
  projectName: string;
  description?: string;
  projectType: string;
  createTime: string;
  updateTime: string;
  reportCount: number;
  lastReportUpdateTime?: string;
}

/**
 * API响应类型
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * 分页结果类型
 */
export interface PageResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 创建工程请求类型
 */
export interface CreateProjectRequest {
  projectName: string;
  description?: string;
  projectType?: string;
}

/**
 * 更新工程请求类型
 */
export interface UpdateProjectRequest {
  projectName?: string;
  description?: string;
  projectType?: string;
}

