import type {
  ApiResponse,
  PageResult,
  Project,
  User,
  CreateProjectRequest,
  UpdateProjectRequest,
  ReportSummary,
  CreateReportRequest,
} from '../types';
import {
  getMockProjectList,
  createMockProject,
  updateMockProject,
  deleteMockProject,
  enterMockProject,
  getMockReportList,
  createMockReportForProject,
  getMockReportDetail,
} from './mockData';

// 使用模拟数据，不依赖后端API
const USE_MOCK_DATA = false;

// API 基础URL
const API_BASE_URL = '/api';

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
    // 真实API调用
    const params = new URLSearchParams({
      userId,
      pageNum: pageNum.toString(),
      pageSize: pageSize.toString(),
    });
    if (keyword) {
      params.append('keyword', keyword);
    }
    if (sortField) {
      params.append('sortField', sortField);
    }
    if (sortOrder) {
      params.append('sortOrder', sortOrder);
    }
    const response = await fetch(`${API_BASE_URL}/projects?${params.toString()}`);
    const result: ApiResponse<PageResult<Project>> = await response.json();
    return result;
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
    // 真实API调用
    const response = await fetch(`${API_BASE_URL}/projects?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    const result: ApiResponse<Project> = await response.json();
    return result;
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
    // 真实API调用
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}?userId=${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    const result: ApiResponse<Project> = await response.json();
    return result;
  },

  /**
   * 删除工程
   */
  deleteProject: async (userId: string, projectId: string): Promise<ApiResponse<void>> => {
    if (USE_MOCK_DATA) {
      await deleteMockProject(userId, projectId);
      return { success: true, message: '删除成功', data: undefined };
    }
    // 真实API调用
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}?userId=${userId}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();
    return result;
  },

  /**
   * 进入工程
   */
  enterProject: async (userId: string, projectId: string): Promise<ApiResponse<Project>> => {
    if (USE_MOCK_DATA) {
      const data = await enterMockProject(userId, projectId);
      return { success: true, data };
    }
    // 真实API调用
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/enter?userId=${userId}`, {
      method: 'POST',
    });
    const result: ApiResponse<Project> = await response.json();
    return result;
  },
};

/**
 * 报表API
 */
export const reportApi = {
  /**
   * 获取工程下的报表列表
   */
  getProjectReports: async (projectId: string): Promise<ApiResponse<ReportSummary[]>> => {
    if (USE_MOCK_DATA) {
      const data = await getMockReportList(projectId);
      return { success: true, data };
    }
    throw new Error('真实API未实现');
  },

  /**
   * 创建报表
   */
  createReport: async (
    userId: string,
    projectId: string,
    request: CreateReportRequest
  ): Promise<ApiResponse<ReportSummary>> => {
    if (USE_MOCK_DATA) {
      const data = await createMockReportForProject(userId, projectId, request);
      return { success: true, message: '创建报表成功', data };
    }
    throw new Error('真实API未实现');
  },

  /**
   * 获取报表详情
   */
  getReportDetail: async (projectId: string, reportId: string): Promise<ApiResponse<ReportSummary>> => {
    if (USE_MOCK_DATA) {
      const data = await getMockReportDetail(projectId, reportId);
      return { success: true, data };
    }
    throw new Error('真实API未实现');
  },
};

