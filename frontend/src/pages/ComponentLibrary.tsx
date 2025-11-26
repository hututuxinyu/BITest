import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Tree,
  Input,
  Tag,
  Space,
  Select,
  List,
  Avatar,
  Button,
  Tooltip,
  Modal,
  Descriptions,
  Tabs,
  Table,
  message,
  Empty,
  Skeleton,
  Result,
} from 'antd';
import {
  BlockOutlined,
  AppstoreOutlined,
  PictureOutlined,
  ControlOutlined,
  ContainerOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { componentApi } from '../services/componentApi';
import ChartRenderer from '../components/ChartRenderer';
import type {
  ComponentCategory,
  ComponentTag,
  ComponentSummary,
  ComponentDefinition,
} from '../types';

const iconMap: Record<string, React.ReactNode> = {
  AppstoreOutlined: <AppstoreOutlined />,
  PictureOutlined: <PictureOutlined />,
  ControlOutlined: <ControlOutlined />,
  ContainerOutlined: <ContainerOutlined />,
};

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '基础图表', value: 'chart' },
  { label: '多媒体', value: 'media' },
  { label: '容器组件', value: 'container' },
  { label: '控制组件', value: 'control' },
];

/**
 * 组件库管理页面
 */
interface CanvasItem {
  id: string;
  component: ComponentSummary;
  definition?: ComponentDefinition | null;
  loading: boolean;
  error?: string;
}

const ComponentLibrary: React.FC = () => {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [tags, setTags] = useState<ComponentTag[]>([]);
  const [components, setComponents] = useState<ComponentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewComponent, setPreviewComponent] = useState<ComponentSummary | null>(null);
  const [definition, setDefinition] = useState<ComponentDefinition | null>(null);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);

  useEffect(() => {
    componentApi.getCategories().then(setCategories);
    componentApi.getTags().then(setTags);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const list = await componentApi.listComponents({
          keyword: keyword || undefined,
          categoryId: selectedCategory,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          type: typeFilter || undefined,
        });
        setComponents(list);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [keyword, selectedCategory, selectedTags, typeFilter]);

  const treeData = useMemo(() => {
    const map: Record<string, any> = {};
    const roots: any[] = [];
    categories.forEach((cat) => {
      map[cat.categoryId] = {
        key: cat.categoryId,
        title: (
          <Space>
            {cat.icon && iconMap[cat.icon]}
            <span>{cat.categoryName}</span>
          </Space>
        ),
        icon: cat.icon && iconMap[cat.icon],
        children: [],
      };
    });
    categories.forEach((cat) => {
      const node = map[cat.categoryId];
      if (cat.parentId && map[cat.parentId]) {
        map[cat.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [categories]);

  const tagElements = tags.map((tag) => (
    <Tag.CheckableTag
      key={tag.tagId}
      checked={selectedTags.includes(tag.tagId)}
      onChange={(checked) => {
        const next = checked ? [...selectedTags, tag.tagId] : selectedTags.filter((t) => t !== tag.tagId);
        setSelectedTags(next);
      }}
    >
      {tag.tagName}
    </Tag.CheckableTag>
  ));

  const handlePreview = async (component: ComponentSummary) => {
    setPreviewComponent(component);
    setPreviewVisible(true);
    const def = await componentApi.getDefinition(component.componentId);
    setDefinition(def);
  };

  const columns = [
    {
      title: '属性',
      dataIndex: 'label',
      key: 'label',
      width: 150,
    },
    {
      title: '字段',
      dataIndex: 'field',
      key: 'field',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '默认值',
      dataIndex: 'default',
      key: 'default',
      render: (value: any) => (value === undefined ? '-' : JSON.stringify(value)),
    },
  ];

  const handleDragStart = (e: React.DragEvent, component: ComponentSummary) => {
    e.dataTransfer.setData('component', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('component');
    if (data) {
      const component = JSON.parse(data) as ComponentSummary;
      const newItem: CanvasItem = {
        id: `${component.componentId}-${Date.now()}`,
        component,
        loading: true,
      };
      setCanvasItems((prev) => [...prev, newItem]);
      message.success(`已将 ${component.componentName} 添加到画布`);
      componentApi
        .getDefinition(component.componentId)
        .then((def) => {
          setCanvasItems((prev) =>
            prev.map((item) =>
              item.id === newItem.id
                ? {
                    ...item,
                    definition: def,
                    loading: false,
                    error: def ? undefined : '未找到组件定义，无法渲染。',
                  }
                : item
            )
          );
        })
        .catch(() => {
          setCanvasItems((prev) =>
            prev.map((item) =>
              item.id === newItem.id
                ? {
                    ...item,
                    loading: false,
                    error: '加载组件定义失败，请稍后重试。',
                  }
                : item
            )
          );
        });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        <BlockOutlined style={{ marginRight: 8 }} />
        组件库管理
      </h2>
      <div style={{ display: 'flex', gap: 16 }}>
        <Card title="组件库" style={{ width: 360 }} bodyStyle={{ padding: 16, height: 'calc(100vh - 220px)', overflow: 'auto' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Input.Search
              placeholder="搜索组件名称 / 描述"
              allowClear
              onSearch={setKeyword}
            />
            <Select
              value={typeFilter}
              style={{ width: '100%' }}
              onChange={setTypeFilter}
              options={typeOptions}
            />
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>标签筛选</div>
              <Space size={[8, 8]} wrap>
                {tagElements}
                {tags.length === 0 && <span style={{ color: '#999' }}>暂无标签</span>}
              </Space>
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>分类</div>
              <Tree
                treeData={treeData}
                defaultExpandAll
                onSelect={(keys) => setSelectedCategory(keys[0] as string)}
                selectedKeys={selectedCategory ? [selectedCategory] : []}
              />
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>组件列表（拖拽到右侧画布）</div>
              <List
                loading={loading}
                dataSource={components}
                renderItem={(item) => (
                  <List.Item
                    key={item.componentId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    style={{ cursor: 'grab' }}
                    actions={[
                      <Tooltip title="预览">
                        <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreview(item)} />
                      </Tooltip>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={item.icon} />}
                      title={
                        <Space>
                          <span>{item.componentName}</span>
                          <Tag>{item.version}</Tag>
                        </Space>
                      }
                      description={<span style={{ color: '#666' }}>{item.description}</span>}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Space>
        </Card>
        <div style={{ flex: 1 }}>
          <Card
            title="画布区域（拖拽左侧组件到此）"
            bodyStyle={{
              minHeight: 'calc(100vh - 220px)',
              background: '#f9fbff',
              border: '1px dashed #91d5ff',
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {canvasItems.length === 0 ? (
              <Empty description="拖拽左侧组件到画布区域，开始构建布局" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {canvasItems.map((item, index) => (
                  <Card
                    key={item.id}
                    size="small"
                    title={
                      <Space>
                        <Avatar size="small" src={item.component.icon} />
                        <span>{item.component.componentName}</span>
                        <Tag color="blue">实例 {index + 1}</Tag>
                      </Space>
                    }
                    extra={
                      <Space>
                        <Button type="link" onClick={() => message.info('属性配置面板待与画布集成')}>
                          配置属性
                        </Button>
                        <Button danger type="link" onClick={() => setCanvasItems((prev) => prev.filter((_, i) => i !== index))}>
                          移除
                        </Button>
                      </Space>
                    }
                  >
                    <div
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: '#fff',
                      }}
                    >
                      {renderCanvasContent(item)}
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </div>
      </div>

      <Modal
        title={previewComponent ? `${previewComponent.componentName} - 组件预览` : '组件预览'}
        open={previewVisible}
        width={900}
        footer={null}
        onCancel={() => {
          setPreviewVisible(false);
          setDefinition(null);
        }}
      >
        {previewComponent && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="组件名称">{previewComponent.componentName}</Descriptions.Item>
              <Descriptions.Item label="版本">{previewComponent.version}</Descriptions.Item>
              <Descriptions.Item label="类型">{previewComponent.type}</Descriptions.Item>
              <Descriptions.Item label="作者">{previewComponent.author}</Descriptions.Item>
              <Descriptions.Item label="发布时间">{previewComponent.releaseTime}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {previewComponent.description}
              </Descriptions.Item>
            </Descriptions>
            {definition ? (
              <Tabs
                items={[
                  {
                    key: 'props',
                    label: '属性配置',
                    children: (
                      <Table
                        dataSource={definition.propsSchema}
                        columns={columns}
                        size="small"
                        pagination={false}
                        rowKey="field"
                      />
                    ),
                  },
                  {
                    key: 'data',
                    label: '数据字段',
                    children: (
                      <Table
                        dataSource={definition.dataSchema}
                        columns={[
                          { title: '字段', dataIndex: 'field', key: 'field', width: 150 },
                          { title: '名称', dataIndex: 'label', key: 'label', width: 150 },
                          { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
                          {
                            title: '必填',
                            dataIndex: 'required',
                            key: 'required',
                            width: 80,
                            render: (val: boolean) => (val ? '是' : '否'),
                          },
                          { title: '说明', dataIndex: 'description', key: 'description' },
                        ]}
                        size="small"
                        pagination={false}
                        rowKey="field"
                      />
                    ),
                  },
                  {
                    key: 'events',
                    label: '事件定义',
                    children: (
                      <Table
                        dataSource={definition.eventSchema}
                        columns={[
                          { title: '事件', dataIndex: 'event', key: 'event', width: 120 },
                          { title: '名称', dataIndex: 'label', key: 'label', width: 150 },
                          {
                            title: '参数',
                            dataIndex: 'params',
                            key: 'params',
                            render: (params: any[]) =>
                              params && params.length > 0
                                ? params.map((p) => `${p.name}(${p.type})`).join(' / ')
                                : '-',
                          },
                          { title: '说明', dataIndex: 'description', key: 'description' },
                        ]}
                        size="small"
                        pagination={false}
                        rowKey="event"
                      />
                    ),
                  },
                  {
                    key: 'mock',
                    label: 'Mock 数据',
                    children: (
                      <pre style={{ maxHeight: 200, overflow: 'auto', background: '#f7f7f7', padding: 12 }}>
                        {JSON.stringify(definition.defaultData, null, 2)}
                      </pre>
                    ),
                  },
                ]}
              />
            ) : (
              <div>加载定义中...</div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ComponentLibrary;

function renderCanvasContent(item: CanvasItem): React.ReactNode {
  if (item.loading) {
    return <Skeleton active style={{ padding: 16 }} />;
  }
  if (item.error) {
    return (
      <Result
        status="warning"
        title="渲染失败"
        subTitle={item.error}
        style={{ padding: '16px 0' }}
      />
    );
  }
  if (item.definition && item.component.type === 'chart') {
    return <ChartRenderer componentId={item.component.componentId} definition={item.definition} />;
  }
  return (
    <img
      src={item.component.previewUrl}
      alt={item.component.componentName}
      style={{ width: '100%', height: 220, objectFit: 'cover' }}
    />
  );
}


