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
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/enter?userId=${userId}`, {
      method: 'POST',
    });
    const result: ApiResponse<Project> = await response.json();
    return result;
  },

  /**
   * 批量导出工程下所有报表的Schema
   */
  exportProjectSchemas: async (userId: string, projectId: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/schemas/export?userId=${userId}`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`批量导出失败: ${response.statusText}`);
    }
    return await response.blob();
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
    const response = await fetch(`${API_BASE_URL}/reports/project/${projectId}`);
    const result: ApiResponse<ReportSummary[]> = await response.json();
    return result;
  },

  /**
   * 创建报表
   */
  createReport: async (
    userId: string,
    projectId: string,
    request: CreateReportRequest
  ): Promise<ApiResponse<ReportSummary>> => {
    const response = await fetch(`${API_BASE_URL}/reports/project/${projectId}?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    const result: ApiResponse<ReportSummary> = await response.json();
    return result;
  },

  /**
   * 获取报表详情
   */
  getReportDetail: async (projectId: string, reportId: string): Promise<ApiResponse<ReportSummary>> => {
    const response = await fetch(`${API_BASE_URL}/reports/project/${projectId}/${reportId}`);
    const result: ApiResponse<ReportSummary> = await response.json();
    return result;
  },

  /**
   * 删除报表
   */
  deleteReport: async (
    userId: string,
    projectId: string,
    reportId: string
  ): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE_URL}/reports/project/${projectId}/${reportId}?userId=${userId}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<void> = await response.json();
    return result;
  },

  /**
   * 导出报表Schema
   */
  exportReportSchema: async (
    userId: string,
    projectId: string,
    reportId: string
  ): Promise<Blob> => {
    const response = await fetch(
      `${API_BASE_URL}/reports/project/${projectId}/${reportId}/schema/export?userId=${userId}`,
      {
        method: 'GET',
      }
    );
    if (!response.ok) {
      throw new Error(`导出失败: ${response.statusText}`);
    }
    return await response.blob();
  },

  /**
   * 验证报表Schema
   */
  validateReportSchema: async (
    projectId: string,
    reportId: string
  ): Promise<ApiResponse<{ valid: boolean; errors: string[]; errorMessage: string }>> => {
    const response = await fetch(`${API_BASE_URL}/reports/project/${projectId}/${reportId}/schema/validate`);
    const result: ApiResponse<{ valid: boolean; errors: string[]; errorMessage: string }> = await response.json();
    return result;
  },
};

