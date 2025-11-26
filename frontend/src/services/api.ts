import type { ApiResponse, PageResult, Project, User, CreateProjectRequest, UpdateProjectRequest } from '../types';
import {
  getMockProjectList,
  createMockProject,
  updateMockProject,
  deleteMockProject,
  enterMockProject,
} from './mockData';

// 使用模拟数据，不依赖后端API
const USE_MOCK_DATA = true;

/**
 * 用户API（暂时不使用）
 */
export const userApi = {
  login: async (username: string, _password: string): Promise<ApiResponse<User>> => {
    return { success: true, data: { userId: 'user-001', username, status: 'active' } };
  },
  getCurrentUser: async (userId: string): Promise<ApiResponse<User>> => {
    return { success: true, data: { userId, username: 'admin', status: 'active' } };
  },
};

/**
 * 工程API
 * 使用模拟数据，不依赖后端
 */
export const projectApi = {
  /**
   * 获取工程列表
   */
  getProjectList: async (
    userId: string,
    pageNum: number = 1,
    pageSize: number = 10,
    keyword?: string,
    sortField?: string,
    sortOrder?: string
  ): Promise<ApiResponse<PageResult<Project>>> => {
    if (USE_MOCK_DATA) {
      const data = await getMockProjectList(userId, pageNum, pageSize, keyword, sortField, sortOrder);
      return { success: true, data };
    }
    // 真实API调用（暂时不使用）
    throw new Error('真实API未实现');
  },

  /**
   * 创建工程
   */
  createProject: async (
    userId: string,
    request: CreateProjectRequest
  ): Promise<ApiResponse<Project>> => {
    if (USE_MOCK_DATA) {
      const data = await createMockProject(userId, request);
      return { success: true, message: '创建成功', data };
    }
    throw new Error('真实API未实现');
  },

  /**
   * 更新工程
   */
  updateProject: async (
    userId: string,
    projectId: string,
    request: UpdateProjectRequest
  ): Promise<ApiResponse<Project>> => {
    if (USE_MOCK_DATA) {
      const data = await updateMockProject(userId, projectId, request);
      return { success: true, message: '更新成功', data };
    }
    throw new Error('真实API未实现');
  },

  /**
   * 删除工程
   */
  deleteProject: async (userId: string, projectId: string): Promise<ApiResponse<void>> => {
    if (USE_MOCK_DATA) {
      await deleteMockProject(userId, projectId);
      return { success: true, message: '删除成功', data: undefined };
    }
    throw new Error('真实API未实现');
  },

  /**
   * 进入工程
   */
  enterProject: async (userId: string, projectId: string): Promise<ApiResponse<Project>> => {
    if (USE_MOCK_DATA) {
      const data = await enterMockProject(userId, projectId);
      return { success: true, data };
    }
    throw new Error('真实API未实现');
  },
};

