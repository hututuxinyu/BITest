import type { Project, PageResult, ReportSummary, CreateReportRequest } from '../types';

/**
 * 模拟数据服务
 * 用于前端开发，不依赖后端API
 */

// 模拟工程数据
let mockProjects: Project[] = [
  {
    projectId: 'project-001',
    projectName: '销售数据分析工程',
    description: '用于分析销售数据的BI报表工程',
    projectType: 'private',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-20 14:20:00',
    reportCount: 5,
    lastReportUpdateTime: '2024-01-20 14:20:00',
  },
  {
    projectId: 'project-002',
    projectName: '财务监控大屏',
    description: '实时监控财务指标的大屏展示工程',
    projectType: 'public',
    createTime: '2024-01-10 09:15:00',
    updateTime: '2024-01-18 16:45:00',
    reportCount: 3,
    lastReportUpdateTime: '2024-01-18 16:45:00',
  },
  {
    projectId: 'project-003',
    projectName: '用户行为分析',
    description: '分析用户行为数据的报表工程',
    projectType: 'private',
    createTime: '2024-01-05 11:00:00',
    updateTime: '2024-01-15 10:30:00',
    reportCount: 8,
    lastReportUpdateTime: '2024-01-15 10:30:00',
  },
];

// 模拟报表数据
const mockProjectReports: Record<string, ReportSummary[]> = {
  'project-001': [
    {
      reportId: 'report-001',
      projectId: 'project-001',
      reportName: '销售额趋势分析',
      description: '监控核心品类的销售额同比与环比走势',
      status: 'draft',
      template: '多轴折线图',
      tags: ['销售', '趋势'],
      createdTime: '2024-01-12 09:00:00',
      updateTime: '2024-01-20 12:40:00',
      createdBy: 'admin',
      lastEditedBy: 'admin',
    },
    {
      reportId: 'report-002',
      projectId: 'project-001',
      reportName: '渠道绩效对比',
      description: '对比线上线下渠道的成交额、客单价与转化',
      status: 'published',
      template: '对比大屏',
      tags: ['渠道', '对比'],
      createdTime: '2024-01-10 17:30:00',
      updateTime: '2024-01-18 15:10:00',
      createdBy: 'alisa',
      lastEditedBy: 'alisa',
    },
  ],
  'project-002': [
    {
      reportId: 'report-101',
      projectId: 'project-002',
      reportName: '财务健康监控',
      description: '实时监控现金流、毛利率与费用率',
      status: 'published',
      template: '指标驾驶舱',
      tags: ['财务'],
      createdTime: '2024-01-08 10:00:00',
      updateTime: '2024-01-18 11:05:00',
      createdBy: 'frank',
      lastEditedBy: 'frank',
    },
  ],
};

/**
 * 模拟API延迟
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 获取工程列表（模拟）
 */
export const getMockProjectList = async (
  userId: string,
  pageNum: number = 1,
  pageSize: number = 10,
  keyword?: string,
  sortField?: string,
  sortOrder?: string
): Promise<PageResult<Project>> => {
  await delay(500); // 模拟网络延迟

  let filteredProjects = [...mockProjects];

  // 搜索过滤
  if (keyword) {
    filteredProjects = filteredProjects.filter((p) =>
      p.projectName.includes(keyword)
    );
  }

  // 排序
  if (sortField) {
    filteredProjects.sort((a, b) => {
      const aValue = (a as any)[sortField];
      const bValue = (b as any)[sortField];
      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  } else {
    // 默认按创建时间倒序
    filteredProjects.sort((a, b) => {
      return b.createTime.localeCompare(a.createTime);
    });
  }

  // 分页
  const total = filteredProjects.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const list = filteredProjects.slice(start, end);

  return {
    list,
    total,
    pageNum,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * 创建工程（模拟）
 */
export const createMockProject = async (
  userId: string,
  project: {
    projectName: string;
    description?: string;
    projectType?: string;
  }
): Promise<Project> => {
  await delay(300);

  const newProject: Project = {
    projectId: `project-${Date.now()}`,
    projectName: project.projectName,
    description: project.description || '',
    projectType: project.projectType || 'private',
    createTime: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/\//g, '-'),
    updateTime: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/\//g, '-'),
    reportCount: 0,
  };

  mockProjects.push(newProject);
  return newProject;
};

/**
 * 获取工程内的报表列表（模拟）
 */
export const getMockReportList = async (projectId: string): Promise<ReportSummary[]> => {
  await delay(300);
  return mockProjectReports[projectId]?.slice() ?? [];
};

/**
 * 创建新报表（模拟）
 */
export const createMockReportForProject = async (
  userId: string,
  projectId: string,
  payload: CreateReportRequest
): Promise<ReportSummary> => {
  await delay(300);
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(/\//g, '-');
  const newReport: ReportSummary = {
    reportId: `report-${Date.now()}`,
    projectId,
    reportName: payload.reportName,
    description: payload.description,
    status: 'draft',
    template: payload.template,
    tags: payload.template ? [payload.template] : undefined,
    createdTime: timestamp,
    updateTime: timestamp,
    createdBy: userId,
    lastEditedBy: userId,
  };
  if (!mockProjectReports[projectId]) {
    mockProjectReports[projectId] = [];
  }
  mockProjectReports[projectId].unshift(newReport);
  const project = mockProjects.find((item) => item.projectId === projectId);
  if (project) {
    project.reportCount = mockProjectReports[projectId].length;
    project.lastReportUpdateTime = newReport.updateTime;
    project.updateTime = newReport.updateTime;
  }
  return newReport;
};

/**
 * 获取报表详情（模拟）
 */
export const getMockReportDetail = async (projectId: string, reportId: string): Promise<ReportSummary> => {
  await delay(200);
  const report = mockProjectReports[projectId]?.find((item) => item.reportId === reportId);
  if (!report) {
    throw new Error('报表不存在');
  }
  return report;
};

/**
 * 更新工程（模拟）
 */
export const updateMockProject = async (
  userId: string,
  projectId: string,
  updates: {
    projectName?: string;
    description?: string;
    projectType?: string;
  }
): Promise<Project> => {
  await delay(300);

  const project = mockProjects.find((p) => p.projectId === projectId);
  if (!project) {
    throw new Error('工程不存在');
  }

  if (updates.projectName) {
    project.projectName = updates.projectName;
  }
  if (updates.description !== undefined) {
    project.description = updates.description;
  }
  if (updates.projectType) {
    project.projectType = updates.projectType;
  }
  project.updateTime = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(/\//g, '-');

  return project;
};

/**
 * 删除工程（模拟）
 */
export const deleteMockProject = async (
  userId: string,
  projectId: string
): Promise<void> => {
  await delay(300);

  const index = mockProjects.findIndex((p) => p.projectId === projectId);
  if (index !== -1) {
    mockProjects.splice(index, 1);
  }
};

/**
 * 进入工程（模拟）
 */
export const enterMockProject = async (
  userId: string,
  projectId: string
): Promise<Project> => {
  await delay(200);

  const project = mockProjects.find((p) => p.projectId === projectId);
  if (!project) {
    throw new Error('工程不存在');
  }

  return project;
};


