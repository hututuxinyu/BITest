import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Card,
} from 'antd';
import {
  PlusOutlined,
  FolderOutlined,
  ImportOutlined,
  ExportOutlined,
  GitlabOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { projectApi } from '../services/api';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types';

const { TextArea } = Input;
const { Option } = Select;

interface ProjectManagementProps {
  user: { userId: string; username?: string };
}

/**
 * 工程管理页面组件
 * 符合AR设计文档的界面布局要求
 */
const ProjectManagement: React.FC<ProjectManagementProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [sortField, setSortField] = useState<string>('createTime');
  const [sortOrder, setSortOrder] = useState<string>('DESC');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [commitModalVisible, setCommitModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const [importForm] = Form.useForm();
  const [commitForm] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, [pageNum, pageSize, keyword, sortField, sortOrder]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await projectApi.getProjectList(
        user.userId,
        pageNum,
        pageSize,
        keyword || undefined,
        sortField,
        sortOrder
      );
      if (response.success && response.data) {
        setProjects(response.data.list);
        setTotal(response.data.total);
      }
    } catch (error: any) {
      message.error('加载工程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: CreateProjectRequest) => {
    try {
      const response = await projectApi.createProject(user.userId, values);
      if (response.success) {
        message.success('创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        loadProjects();
      } else {
        message.error(response.message || '创建失败');
      }
    } catch (error: any) {
      message.error(error.message || '创建失败');
    }
  };

  const handleEdit = (_project: Project) => {
    // 编辑功能已集成在操作列中，这里保留用于后续扩展
  };

  const handleUpdate = async (values: UpdateProjectRequest) => {
    if (!editingProject) {
      return;
    }
    try {
      const response = await projectApi.updateProject(
        user.userId,
        editingProject.projectId,
        values
      );
      if (response.success) {
        message.success('更新成功');
        setEditModalVisible(false);
        setEditingProject(null);
        form.resetFields();
        loadProjects();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  const handleDelete = async (_projectId: string) => {
    // 删除功能已集成在批量删除中，这里保留用于后续扩展
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的工程');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个工程吗？删除后无法恢复，请谨慎操作。`,
      onOk: async () => {
        try {
          for (const projectId of selectedRowKeys) {
            await projectApi.deleteProject(user.userId, projectId as string);
          }
          message.success('删除成功');
          setSelectedRowKeys([]);
          loadProjects();
        } catch (error: any) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleImport = () => {
    message.info('导入模型功能待实现（需要Codehub集成模块）');
    setImportModalVisible(false);
  };

  const handleExport = () => {
    message.info('导出模型功能待实现（需要报表模块）');
    setExportModalVisible(false);
  };

  const handleCommit = async (_values: { commitMessage: string }) => {
    message.info('提交Git功能待实现（需要Codehub集成模块）');
    setCommitModalVisible(false);
    commitForm.resetFields();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('DESC');
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  const columns = [
    {
      title: '工程名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      render: (text: string, record: Project) => (
        <Space>
          <FolderOutlined style={{ color: '#1890ff' }} />
          <a
            onClick={() => {
              message.info('进入工程功能待实现（需要报表编辑界面）');
            }}
          >
            {text}
          </a>
        </Space>
      ),
      sorter: true,
      onHeaderCell: () => ({
        onClick: () => handleSort('projectName'),
      }),
    },
    {
      title: '工程类型',
      dataIndex: 'projectType',
      key: 'projectType',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'private' ? 'blue' : 'green'}>
          {type === 'private' ? '私有工程' : '公共工程'}
        </Tag>
      ),
      sorter: true,
      onHeaderCell: () => ({
        onClick: () => handleSort('projectType'),
      }),
    },
    {
      title: '工程描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <span title={text}>{text || '-'}</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      sorter: true,
      onHeaderCell: () => ({
        onClick: () => handleSort('createTime'),
      }),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right' as const,
      render: (_: any, record: Project) => (
        <Space>
          <Button
            type="link"
            icon={<ImportOutlined />}
            onClick={() => {
              setEditingProject(record);
              setImportModalVisible(true);
            }}
          >
            导入模型
          </Button>
          <Button
            type="link"
            icon={<ExportOutlined />}
            onClick={() => {
              setEditingProject(record);
              setExportModalVisible(true);
            }}
          >
            导出模型
          </Button>
          <Button
            type="link"
            icon={<GitlabOutlined />}
            onClick={() => {
              setEditingProject(record);
              commitForm.setFieldsValue({
                commitMessage: `更新工程: ${record.projectName}`,
              });
              setCommitModalVisible(true);
            }}
          >
            提交Git
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <FolderOutlined style={{ marginRight: 8 }} />
        工程管理
      </h2>
        <Card style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建工程
            </Button>
            <Button
              danger
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchDelete}
            >
              删除工程
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadProjects}>
              刷新
            </Button>
          </Space>
          <Input.Search
            placeholder="搜索工程名称"
            style={{ width: 300 }}
            onSearch={(value) => {
              setKeyword(value);
              setPageNum(1);
            }}
            allowClear
          />
          </div>
        </Card>
        <Card>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={projects}
            loading={loading}
            rowKey="projectId"
            pagination={{
              current: pageNum,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, size) => {
                setPageNum(page);
                setPageSize(size);
            },
          }}
        />
        </Card>

        {/* 创建工程对话框 */}
        <Modal
          title="创建工程"
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={form} onFinish={handleCreate} layout="vertical">
            <Form.Item
              name="projectName"
              label="工程名称"
              rules={[{ required: true, message: '请输入工程名称' }]}
            >
              <Input placeholder="请输入工程名称" />
            </Form.Item>
            <Form.Item name="description" label="工程描述">
              <TextArea rows={4} placeholder="请输入工程描述" maxLength={500} />
            </Form.Item>
            <Form.Item
              name="projectType"
              label="工程类型"
              initialValue="private"
              rules={[{ required: true, message: '请选择工程类型' }]}
            >
              <Select>
                <Option value="private">私有工程</Option>
                <Option value="public">公共工程</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  确认
                </Button>
                <Button
                  onClick={() => {
                    setCreateModalVisible(false);
                    form.resetFields();
                  }}
                >
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 编辑工程对话框 */}
        <Modal
          title="编辑工程"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingProject(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={form} onFinish={handleUpdate} layout="vertical">
            <Form.Item
              name="projectName"
              label="工程名称"
              rules={[{ required: true, message: '请输入工程名称' }]}
            >
              <Input placeholder="请输入工程名称" />
            </Form.Item>
            <Form.Item name="description" label="工程描述">
              <TextArea rows={4} placeholder="请输入工程描述" maxLength={500} />
            </Form.Item>
            <Form.Item
              name="projectType"
              label="工程类型"
              rules={[{ required: true, message: '请选择工程类型' }]}
            >
              <Select>
                <Option value="private">私有工程</Option>
                <Option value="public">公共工程</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  确认
                </Button>
                <Button
                  onClick={() => {
                    setEditModalVisible(false);
                    setEditingProject(null);
                    form.resetFields();
                  }}
                >
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 导入模型对话框 */}
        <Modal
          title="导入模型"
          open={importModalVisible}
          onCancel={() => {
            setImportModalVisible(false);
            importForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={importForm} layout="vertical">
            <Form.Item label="Git仓库">
              <Input placeholder="请选择Git仓库" disabled />
            </Form.Item>
            <Form.Item label="Git分支">
              <Input placeholder="请选择Git分支" disabled />
            </Form.Item>
            <div style={{ color: '#999', marginBottom: 16 }}>
              导入模型功能需要Codehub集成模块支持，待后续实现
            </div>
            <Form.Item>
              <Space>
                <Button type="primary" onClick={handleImport}>
                  导入
                </Button>
                <Button
                  onClick={() => {
                    setImportModalVisible(false);
                    importForm.resetFields();
                  }}
                >
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 导出模型对话框 */}
        <Modal
          title="导出模型"
          open={exportModalVisible}
          onCancel={() => setExportModalVisible(false)}
          footer={null}
          width={500}
        >
          <div style={{ marginBottom: 16 }}>
            <p>确认导出当前工程的所有模型？</p>
            <p style={{ color: '#999', fontSize: 12 }}>
              导出文件格式：ZIP，包含所有Schema文件
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setExportModalVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleExport}>
                确认
              </Button>
            </Space>
          </div>
        </Modal>

        {/* 提交Git对话框 */}
        <Modal
          title="提交到Git"
          open={commitModalVisible}
          onCancel={() => {
            setCommitModalVisible(false);
            commitForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={commitForm} onFinish={handleCommit} layout="vertical">
            <Form.Item label="提交人">
              <Input value={user.username || user.userId} disabled />
            </Form.Item>
            <Form.Item label="Git仓库">
              <Input placeholder="自动填充导入的仓库" disabled />
            </Form.Item>
            <Form.Item label="Git分支">
              <Input placeholder="自动填充导入的个人分支" disabled />
            </Form.Item>
            <Form.Item
              name="commitMessage"
              label="提交内容"
              rules={[{ required: true, message: '请输入提交说明' }]}
            >
              <TextArea rows={4} placeholder="请输入提交说明" maxLength={500} />
            </Form.Item>
            <div style={{ color: '#999', marginBottom: 16 }}>
              提交Git功能需要Codehub集成模块支持，待后续实现
            </div>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  确定
                </Button>
                <Button
                  onClick={() => {
                    setCommitModalVisible(false);
                    commitForm.resetFields();
                  }}
                >
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
  );
};

export default ProjectManagement;
