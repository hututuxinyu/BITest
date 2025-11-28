import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Breadcrumb,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Result,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { FolderOutlined, PlusOutlined, ArrowLeftOutlined, FileTextOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Project, ReportSummary, CreateReportRequest } from '../types';
import { projectApi, reportApi } from '../services/api';

const { Paragraph } = Typography;

interface LocationState {
  project?: Project;
}

interface ProjectWorkspaceProps {
  user: { userId: string; username?: string };
}

const templateOptions = [
  { label: '指标驾驶舱', value: '指标驾驶舱' },
  { label: '多轴趋势', value: '多轴趋势' },
  { label: '对比分析', value: '对比分析' },
  { label: '地图洞察', value: '地图洞察' },
];

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ user }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const [project, setProject] = useState<Project | undefined>(state.project);
  const [projectLoading, setProjectLoading] = useState(!state.project);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm<CreateReportRequest>();

  useEffect(() => {
    if (!projectId) {
      return;
    }
    if (!project) {
      setProjectLoading(true);
      projectApi
        .enterProject(user.userId, projectId)
        .then((response) => {
          if (response.success) {
            setProject(response.data);
          } else {
            message.error(response.message || '加载工程失败');
          }
        })
        .catch(() => message.error('加载工程失败'))
        .finally(() => setProjectLoading(false));
    }
    setReportLoading(true);
    reportApi
      .getProjectReports(projectId)
      .then((response) => {
        if (response.success) {
          setReports(response.data);
        } else {
          message.error(response.message || '获取报表失败');
        }
      })
      .catch(() => message.error('获取报表失败'))
      .finally(() => setReportLoading(false));
  }, [projectId]);

  const isPrivateProject = project?.projectType === 'private';

  const handleCreateReport = async () => {
    if (!projectId) {
      return;
    }
    try {
      const values = await form.validateFields();
      setCreating(true);
      const response = await reportApi.createReport(user.userId, projectId, values);
      if (response.success) {
        message.success('已创建报表，进入编辑画布');
        setCreateModalVisible(false);
        form.resetFields();
        setReports((prev) => [response.data, ...prev]);
        navigate(`/projects/${projectId}/reports/${response.data.reportId}/editor`, {
          state: { project, report: response.data },
        });
      } else {
        message.error(response.message || '创建报表失败');
      }
    } catch (error) {
      if ((error as any).errorFields) {
        return;
      }
      message.error('创建报表失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteReport = useCallback(
    (report: ReportSummary) => {
      if (!projectId) {
        return;
      }
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除报表"${report.reportName}"吗？此操作不可恢复。`,
        okText: '确认删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            const response = await reportApi.deleteReport(user.userId, projectId, report.reportId);
            if (response.success) {
              message.success('删除报表成功');
              // 刷新报表列表
              setReportLoading(true);
              const reportsResponse = await reportApi.getProjectReports(projectId);
              if (reportsResponse.success) {
                setReports(reportsResponse.data);
              }
              // 刷新工程信息
              if (project) {
                const projectResponse = await projectApi.enterProject(user.userId, projectId);
                if (projectResponse.success) {
                  setProject(projectResponse.data);
                }
              }
            } else {
              message.error(response.message || '删除报表失败');
            }
          } catch (error) {
            message.error('删除报表失败');
          } finally {
            setReportLoading(false);
          }
        },
      });
    },
    [projectId, user.userId, project]
  );

  const reportColumns: ColumnsType<ReportSummary> = useMemo(
    () => [
      {
        title: '报表名称',
        dataIndex: 'reportName',
        render: (_: string, record) => (
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() =>
              navigate(`/projects/${record.projectId}/reports/${record.reportId}/editor`, {
                state: { project, report: record },
              })
            }
          >
            {record.reportName}
          </Button>
        ),
      },
      {
        title: '模板',
        dataIndex: 'template',
        render: (value?: string) => (value ? <Tag>{value}</Tag> : '-'),
        width: 160,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (status: ReportSummary['status']) => {
          let color: string = '#cccccc';
          if (status === 'draft') {
            color = 'gold';
          } else if (status === 'published') {
            color = 'green';
          }
          return <Tag color={color}>{status === 'draft' ? '草稿' : status === 'published' ? '已发布' : '已归档'}</Tag>;
        },
      },
      {
        title: '更新时间',
        dataIndex: 'updateTime',
        width: 200,
      },
      {
        title: '最后编辑人',
        dataIndex: 'lastEditedBy',
        width: 140,
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
        align: 'center',
        render: (_: any, record: ReportSummary) => (
          <Space split={<span style={{ color: '#d9d9d9' }}>|</span>}>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/projects/${record.projectId}/reports/${record.reportId}/editor`, {
                  state: { project, report: record },
                })
              }
            >
              编辑
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteReport(record)}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ],
    [navigate, project, handleDeleteReport]
  );

  if (!projectId) {
    return <Result status="404" title="缺少工程ID" subTitle="请通过工程管理页选择工程后再进入" />;
  }

  if (!project && projectLoading) {
    return <Card loading />;
  }

  if (!project && !projectLoading) {
    return <Result status="404" title="未找到工程" subTitle="请返回工程管理重新选择" extra={<Button onClick={() => navigate('/projects')}>返回列表</Button>} />;
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: '工程管理', onClick: () => navigate('/projects') },
          { title: project?.projectName || '工程详情' },
        ]}
      />
      <Card
        title={
          <Space>
            <FolderOutlined />
            {project?.projectName}
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
              返回工程列表
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!isPrivateProject}
              onClick={() => setCreateModalVisible(true)}
            >
              新建报表
            </Button>
          </Space>
        }
      >
        <Descriptions column={3} size="small">
          <Descriptions.Item label="工程类型">
            <Tag color={isPrivateProject ? 'gold' : 'green'}>{isPrivateProject ? '私有工程' : '公共工程'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="报表数量">{project?.reportCount ?? 0}</Descriptions.Item>
          <Descriptions.Item label="最近报表更新时间">{project?.lastReportUpdateTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{project?.createTime}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{project?.updateTime}</Descriptions.Item>
          <Descriptions.Item label="工程描述">
            <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}>{project?.description || '暂无描述'}</Paragraph>
          </Descriptions.Item>
        </Descriptions>
        {!isPrivateProject && (
          <Paragraph type="secondary" style={{ marginTop: 12 }}>
            当前为公共工程，仅支持查看报表。如需新建报表，请选择个人工程。
          </Paragraph>
        )}
      </Card>

      <Card title="工程报表列表">
        <Table
          rowKey="reportId"
          columns={reportColumns}
          dataSource={reports}
          loading={reportLoading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title="新建报表"
        open={createModalVisible}
        okText="创建并进入画布"
        confirmLoading={creating}
        onOk={handleCreateReport}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="reportName" label="报表名称" rules={[{ required: true, message: '请输入报表名称' }]}>
            <Input placeholder="例如：销售大屏（个人工程）" />
          </Form.Item>
          <Form.Item name="template" label="模板类型">
            <Input placeholder="可输入或在描述中补充模板信息" list="template-options" />
            <datalist id="template-options">
              {templateOptions.map((item) => (
                <option key={item.value} value={item.value} />
              ))}
            </datalist>
          </Form.Item>
          <Form.Item name="description" label="报表描述">
            <Input.TextArea rows={3} placeholder="输入报表目标、关注指标等说明" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ProjectWorkspace;


