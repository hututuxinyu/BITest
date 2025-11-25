import axios from 'axios';
import type { ApiResponse, PageResult, Project, User, CreateProjectRequest, UpdateProjectRequest } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

/**
 * 用户API
 */
export const userApi = {
  /**
   * 用户登录
   */
  login: async (username: string, password: string): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/user/login', {
      username,
      password,
    });
    return response.data;
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/user/current', {
      params: { userId },
    });
    return response.data;
  },
};

/**
 * 工程API
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
    const response = await api.get<ApiResponse<PageResult<Project>>>('/projects', {
      params: {
        userId,
        pageNum,
        pageSize,
        keyword,
        sortField,
        sortOrder,
      },
    });
    return response.data;
  },

  /**
   * 创建工程
   */
  createProject: async (
    userId: string,
    request: CreateProjectRequest
  ): Promise<ApiResponse<Project>> => {
    const response = await api.post<ApiResponse<Project>>('/projects', request, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * 更新工程
   */
  updateProject: async (
    userId: string,
    projectId: string,
    request: UpdateProjectRequest
  ): Promise<ApiResponse<Project>> => {
    const response = await api.put<ApiResponse<Project>>(`/projects/${projectId}`, request, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * 删除工程
   */
  deleteProject: async (userId: string, projectId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/projects/${projectId}`, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * 进入工程
   */
  enterProject: async (userId: string, projectId: string): Promise<ApiResponse<Project>> => {
    const response = await api.post<ApiResponse<Project>>(`/projects/${projectId}/enter`, null, {
      params: { userId },
    });
    return response.data;
  },
};

