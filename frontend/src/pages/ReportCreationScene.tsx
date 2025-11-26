import React, { useEffect, useMemo, useState } from 'react';
import {
  Steps,
  Card,
  Row,
  Col,
  Space,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  List,
  Badge,
  message,
  InputNumber,
  Divider,
  Typography,
} from 'antd';
import {
  UserOutlined,
  FolderOpenOutlined,
  CloudDownloadOutlined,
  AppstoreOutlined,
  BlockOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { projectApi } from '../services/api';
import {
  fetchSceneRepositories,
  fetchSceneTemplates,
  fetchSchemaFiles,
  fetchSceneDataSources,
  fetchInteractionOptions,
  fetchComponentOptions,
} from '../services/reportCreationMock';
import type { Project } from '../types';
import type {
  CodeRepository,
  SchemaFileSummary,
  TemplateDefinition,
  DataSourceDefinition,
  InteractionOption,
  ComponentOption,
  CanvasComponentState,
} from '../types/reportCreation';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

const mockUser = { userId: 'user-001', username: 'admin' };

const ReportCreationScene: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [repositories, setRepositories] = useState<CodeRepository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>();
  const [selectedBranch, setSelectedBranch] = useState<string>();
  const [schemaFiles, setSchemaFiles] = useState<SchemaFileSummary[]>([]);
  const [templates, setTemplates] = useState<TemplateDefinition[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [componentOptions, setComponentOptions] = useState<ComponentOption[]>([]);
  const [dataSources, setDataSources] = useState<DataSourceDefinition[]>([]);
  const [interactionOptions, setInteractionOptions] = useState<InteractionOption[]>([]);
  const [canvasComponents, setCanvasComponents] = useState<CanvasComponentState[]>([]);
  const [activeCanvasId, setActiveCanvasId] = useState<string>();
  const [createForm] = Form.useForm();

  const selectedProject = useMemo(
    () => projects.find((item) => item.projectId === selectedProjectId),
    [projects, selectedProjectId]
  );

  const activeCanvas = useMemo(
    () => canvasComponents.find((item) => item.instanceId === activeCanvasId),
    [canvasComponents, activeCanvasId]
  );

  useEffect(() => {
    loadProjects();
    loadSceneResources();
  }, []);

  const loadProjects = async () => {
    setProjectLoading(true);
    try {
      const response = await projectApi.getProjectList(mockUser.userId, 1, 5);
      if (response.success && response.data) {
        setProjects(response.data.list);
      }
    } finally {
      setProjectLoading(false);
    }
  };

  const loadSceneResources = async () => {
    const [repoList, tplList, dsList, iaList, compList] = await Promise.all([
      fetchSceneRepositories(),
      fetchSceneTemplates(),
      fetchSceneDataSources(),
      fetchInteractionOptions(),
      fetchComponentOptions(),
    ]);
    setRepositories(repoList);
    setTemplates(tplList);
    setDataSources(dsList);
    setInteractionOptions(iaList);
    setComponentOptions(compList);
    if (repoList.length > 0) {
      const personalBranch =
        repoList[0].branches.find((b) => b.isPersonal)?.branchName || repoList[0].branches[0].branchName;
      setSelectedRepoId(repoList[0].repoId);
      setSelectedBranch(personalBranch);
      loadSchema(repoList[0].repoId, personalBranch);
    }
    if (tplList.length > 0) {
      setSelectedTemplateId(tplList[0].templateId);
    }
  };

  const loadSchema = async (repoId: string, branchName: string) => {
    setSchemaLoading(true);
    try {
      const files = await fetchSchemaFiles(repoId, branchName);
      setSchemaFiles(files);
      advanceToStep(3);
    } finally {
      setSchemaLoading(false);
    }
  };

  const handleCreateProject = async () => {
    const values = await createForm.validateFields();
    const response = await projectApi.createProject(mockUser.userId, {
      projectName: values.projectName,
      description: values.description,
      projectType: 'private',
    });
    if (response.success) {
      message.success('创建工程成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      loadProjects();
    }
  };

  const handleAddComponent = (componentId: string) => {
    const option = componentOptions.find((item) => item.componentId === componentId);
    if (!option) {
      return;
    }
    const newItem: CanvasComponentState = {
      instanceId: `canvas-${Date.now()}`,
      componentId: option.componentId,
      title: `${option.name} ${canvasComponents.length + 1}`,
      dataSourceId: option.defaultDataSourceId,
      interactionId: undefined,
      style: { width: 480, height: 260, color: '#2563eb' },
      filters: '',
    };
    setCanvasComponents((prev) => [...prev, newItem]);
    setActiveCanvasId(newItem.instanceId);
    advanceToStep(4);
  };

  const updateCanvasItem = (instanceId: string, updater: (item: CanvasComponentState) => CanvasComponentState) => {
    setCanvasComponents((prev) => prev.map((item) => (item.instanceId === instanceId ? updater(item) : item)));
  };

  const handlePreview = () => {
    if (canvasComponents.length === 0) {
      message.warning('请至少添加一个组件');
      return;
    }
    message.success('已生成预览数据，仿真画布已刷新');
    advanceToStep(6);
  };

  const handleSaveSchema = () => {
    if (!selectedProject) {
      message.warning('请先选择工程');
      return;
    }
    const schemaPayload = {
      projectId: selectedProject.projectId,
      templateId: selectedTemplateId,
      components: canvasComponents,
    };
    message.success(`Schema 已写入：${JSON.stringify(schemaPayload).substring(0, 80)}...`);
  };

  const handlePublish = () => {
    message.success('已触发发布流程，运行态将在几秒后可见');
  };

  const advanceToStep = (target: number) => {
    setCurrentStep((prev) => (target > prev ? target : prev));
  };

  const stepItems = [
    { title: '登录', icon: <UserOutlined /> },
    { title: '工程管理', icon: <FolderOpenOutlined /> },
    { title: 'Schema导入', icon: <CloudDownloadOutlined /> },
    { title: '模板选择', icon: <AppstoreOutlined /> },
    { title: '组件拖拽', icon: <BlockOutlined /> },
    { title: '数据交互', icon: <DatabaseOutlined /> },
    { title: '预览发布', icon: <PlayCircleOutlined /> },
  ];

  const projectColumns = [
    { title: '工程名称', dataIndex: 'projectName' },
    { title: '类型', dataIndex: 'projectType', render: (type: string) => <Tag color={type === 'private' ? 'gold' : 'green'}>{type === 'private' ? '私有' : '公共'}</Tag> },
    { title: '更新时间', dataIndex: 'updateTime' },
  ];

  const schemaColumns = [
    { title: 'Schema文件', dataIndex: 'filePath' },
    { title: '状态', dataIndex: 'status', render: (status: SchemaFileSummary['status']) => <Tag color={status === 'added' ? 'green' : status === 'updated' ? 'orange' : 'default'}>{status}</Tag> },
    { title: '修改人', dataIndex: 'owner' },
    { title: '更新时间', dataIndex: 'lastModified' },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        BI 场景一：创建报表
      </Title>
      <Paragraph style={{ color: '#64748b' }}>
        依据《设计态系统设计说明书》第3.1节，复刻从工程创建、Schema导入、画布编辑到发布的完整前端流程，所有数据基于 Mock 服务。
      </Paragraph>
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={stepItems} responsive />
      </Card>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="用户登录信息" extra={<UserOutlined />}>
            <Space direction="vertical">
              <Text>账号：{mockUser.username}</Text>
              <Text>权限：报表设计、发布</Text>
              <Text>Codehub：已绑定个人分支</Text>
            </Space>
            <Divider />
            <Button
              type="primary"
              block
              onClick={() => {
                advanceToStep(1);
                message.success('已完成登录校验');
              }}
            >
              校验登录
            </Button>
          </Card>
        </Col>
        <Col span={16}>
          <Card
            title="工程管理"
            extra={
              <Space>
                <Button onClick={loadProjects}>刷新</Button>
                <Button type="primary" onClick={() => setCreateModalVisible(true)}>
                  创建工程
                </Button>
              </Space>
            }
          >
            <Table
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedProjectId ? [selectedProjectId] : [],
                onChange: (keys) => {
                  setSelectedProjectId(keys[0] as string);
                  advanceToStep(2);
                },
              }}
              columns={projectColumns}
              dataSource={projects}
              rowKey="projectId"
              loading={projectLoading}
              pagination={false}
              size="small"
            />
            <Divider />
            <Space>
              <Button
                type="primary"
                disabled={!selectedProject}
                onClick={() => message.success(`已进入工程：${selectedProject?.projectName}`)}
              >
                进入工程
              </Button>
              <Button disabled={!selectedProject} onClick={() => message.info('支持导出Schema，待接入后端')}>
                导出Schema
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Codehub Schema 导入" extra={<CloudDownloadOutlined />}>
            <Space style={{ marginBottom: 12 }} size="middle">
              <Select
                placeholder="选择仓库"
                value={selectedRepoId}
                style={{ width: 180 }}
                options={repositories.map((repo) => ({ label: repo.repoName, value: repo.repoId }))}
                onChange={(repoId) => {
                  setSelectedRepoId(repoId);
                  const repo = repositories.find((item) => item.repoId === repoId);
                  const branch = repo?.branches.find((b) => b.isPersonal)?.branchName || repo?.branches[0]?.branchName;
                  setSelectedBranch(branch);
                  if (branch) {
                    loadSchema(repoId, branch);
                  }
                }}
              />
              <Select
                placeholder="选择个人分支"
                value={selectedBranch}
                style={{ width: 200 }}
                options={
                  repositories
                    .find((repo) => repo.repoId === selectedRepoId)
                    ?.branches.map((branch) => ({
                      label: `${branch.branchName}${branch.isPersonal ? '（个人）' : ''}`,
                      value: branch.branchName,
                    })) || []
                }
                onChange={(branch) => {
                  setSelectedBranch(branch);
                  if (selectedRepoId) {
                    loadSchema(selectedRepoId, branch);
                  }
                }}
              />
              <Button loading={schemaLoading} onClick={() => selectedRepoId && selectedBranch && loadSchema(selectedRepoId, selectedBranch)}>
                拉取全量Schema
              </Button>
            </Space>
            <Table columns={schemaColumns} dataSource={schemaFiles} rowKey="filePath" size="small" pagination={false} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="模板选择" extra={<AppstoreOutlined />}>
            <List
              dataSource={templates}
              renderItem={(item) => (
                <List.Item
                  key={item.templateId}
                  actions={[
                    <Button
                      type={item.templateId === selectedTemplateId ? 'primary' : 'default'}
                      onClick={() => {
                        setSelectedTemplateId(item.templateId);
                        advanceToStep(3);
                      }}
                    >
                      选择
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{item.name}</Text>
                        {item.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </Space>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="组件库" extra={<BlockOutlined />}>
            <List
              dataSource={componentOptions}
              renderItem={(item) => (
                <List.Item
                  key={item.componentId}
                  actions={[
                    <Button type="link" onClick={() => handleAddComponent(item.componentId)}>
                      添加到画布
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{item.name}</Text>
                        <Tag>{item.type}</Tag>
                      </Space>
                    }
                    description={item.description}
                  />
                  <div>
                    <Text type="secondary">默认数据源：{item.defaultDataSourceId}</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="画布与预览" extra={<ThunderboltOutlined />}>
            {canvasComponents.length === 0 ? (
              <Text type="secondary">请从左侧添加组件</Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {canvasComponents.map((item) => (
                  <Card
                    key={item.instanceId}
                    size="small"
                    style={{ border: activeCanvasId === item.instanceId ? '1px solid #1677ff' : undefined }}
                    onClick={() => setActiveCanvasId(item.instanceId)}
                  >
                    <Space align="start">
                      <Badge status="processing" />
                      <div style={{ flex: 1 }}>
                        <Text strong>{item.title}</Text>
                        <div style={{ color: '#64748b' }}>
                          {item.componentId} · {item.style.width}x{item.style.height}px · {item.style.color}
                        </div>
                      </div>
                      <Tag>{item.dataSourceId}</Tag>
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
            <Divider />
            <Space>
              <Button type="primary" onClick={handlePreview}>
                预览效果
              </Button>
              <Button onClick={handleSaveSchema}>生成 Schema</Button>
              <Button type="dashed" onClick={handlePublish}>
                发布报表
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="属性 / 数据源配置" extra={<DatabaseOutlined />}>
            {activeCanvas ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  value={activeCanvas.title}
                  onChange={(e) =>
                    updateCanvasItem(activeCanvas.instanceId, (item) => ({ ...item, title: e.target.value }))
                  }
                  placeholder="组件标题"
                />
                <Space>
                  <InputNumber
                    addonBefore="宽"
                    value={activeCanvas.style.width}
                    onChange={(val) =>
                      updateCanvasItem(activeCanvas.instanceId, (item) => ({
                        ...item,
                        style: { ...item.style, width: Number(val) || item.style.width },
                      }))
                    }
                  />
                  <InputNumber
                    addonBefore="高"
                    value={activeCanvas.style.height}
                    onChange={(val) =>
                      updateCanvasItem(activeCanvas.instanceId, (item) => ({
                        ...item,
                        style: { ...item.style, height: Number(val) || item.style.height },
                      }))
                    }
                  />
                  <Input
                    addonBefore="主题色"
                    value={activeCanvas.style.color}
                    onChange={(e) =>
                      updateCanvasItem(activeCanvas.instanceId, (item) => ({
                        ...item,
                        style: { ...item.style, color: e.target.value },
                      }))
                    }
                  />
                </Space>
                <Select
                  value={activeCanvas.dataSourceId}
                  options={dataSources.map((ds) => ({ label: ds.name, value: ds.dataSourceId }))}
                  onChange={(value) =>
                    updateCanvasItem(activeCanvas.instanceId, (item) => ({ ...item, dataSourceId: value }))
                  }
                />
                <Select
                  allowClear
                  placeholder="交互事件"
                  value={activeCanvas.interactionId}
                  options={interactionOptions.map((it) => ({ label: it.name, value: it.interactionId }))}
                  onChange={(value) =>
                    updateCanvasItem(activeCanvas.instanceId, (item) => ({ ...item, interactionId: value }))
                  }
                />
                <TextArea
                  rows={3}
                  placeholder={`数据过滤条件，如 channel = "线上"`}
                  value={activeCanvas.filters}
                  onChange={(e) =>
                    updateCanvasItem(activeCanvas.instanceId, (item) => ({ ...item, filters: e.target.value }))
                  }
                />
              </Space>
            ) : (
              <Text type="secondary">请选择画布中的组件查看属性</Text>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="数据源状态 & 交互" extra={<ThunderboltOutlined />}>
            <List
              header="数据源连接"
              dataSource={dataSources}
              renderItem={(item: DataSourceDefinition) => (
                <List.Item key={item.dataSourceId}>
                  <Space>
                    <Badge status={item.status === 'connected' ? 'success' : item.status === 'warning' ? 'warning' : 'error'} />
                    <div>
                      <Text strong>{item.name}</Text>
                      <div style={{ color: '#94a3b8' }}>{item.description}</div>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
            <Divider />
            <List
              header="交互事件"
              dataSource={interactionOptions}
              renderItem={(item: InteractionOption) => (
                <List.Item key={item.interactionId}>
                  <Space direction="vertical">
                    <Text strong>{item.name}</Text>
                    <div style={{ color: '#94a3b8' }}>{item.description}</div>
                    <Text code>{item.eventExample}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="创建工程"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        onOk={handleCreateProject}
        okText="创建"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="projectName" label="工程名称" rules={[{ required: true, message: '请输入工程名称' }]}>
            <Input placeholder="请输入工程名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入工程描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportCreationScene;

