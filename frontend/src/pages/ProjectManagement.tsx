import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LogoutOutlined } from '@ant-design/icons';
import { projectApi } from '../services/api';
import type { Project, CreateProjectRequest, UpdateProjectRequest, PageResult } from '../types';

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;

interface ProjectManagementProps {
  user: { userId: string; username?: string };
  onLogout: () => void;
}

/**
 * 工程管理页面组件
 */
const ProjectManagement: React.FC<ProjectManagementProps> = ({ user, onLogout }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, [pageNum, pageSize, keyword]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await projectApi.getProjectList(
        user.userId,
        pageNum,
        pageSize,
        keyword || undefined
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
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      projectName: project.projectName,
      description: project.description,
      projectType: project.projectType,
    });
    setEditModalVisible(true);
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
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const response = await projectApi.deleteProject(user.userId, projectId);
      if (response.success) {
        message.success('删除成功');
        loadProjects();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const columns = [
    {
      title: '工程名称',
      dataIndex: 'projectName',
      key: 'projectName',
    },
    {
      title: '工程类型',
      dataIndex: 'projectType',
      key: 'projectType',
      render: (type: string) => (type === 'private' ? '私有工程' : '公共工程'),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '报表数量',
      dataIndex: 'reportCount',
      key: 'reportCount',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Project) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个工程吗？"
            onConfirm={() => handleDelete(record.projectId)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#fff', margin: 0 }}>BI系统 - 工程管理</h1>
        <Space>
          <span style={{ color: '#fff' }}>{user.username || user.userId}</span>
          <Button type="primary" icon={<LogoutOutlined />} onClick={onLogout}>
            退出登录
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search
              placeholder="搜索工程名称"
              style={{ width: 300 }}
              onSearch={(value) => {
                setKeyword(value);
                setPageNum(1);
              }}
            />
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建工程
          </Button>
        </div>
        <Table
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
        <Modal
          title="创建工程"
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            form.resetFields();
          }}
          footer={null}
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
              <TextArea rows={4} placeholder="请输入工程描述" />
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
        <Modal
          title="编辑工程"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingProject(null);
            form.resetFields();
          }}
          footer={null}
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
              <TextArea rows={4} placeholder="请输入工程描述" />
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
      </Content>
    </Layout>
  );
};

export default ProjectManagement;

