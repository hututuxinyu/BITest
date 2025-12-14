/**
 * 数据源配置面板组件
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Form, Select, Button, Modal, Input, message, Empty, Tree, Table} from 'antd';
import type { ComponentDefinition, DatasourceConfig, Dataset, DatasetField } from '../../../types';
import { datasourceApi } from '../../../services/datasourceApi';
import type { DataNode } from 'antd/es/tree';

const { TextArea } = Input;

interface DatasourceConfigPanelProps {
  componentId?: string;
  componentDefinition?: ComponentDefinition | null;
  datasets?: Dataset[]; // 数据集列表（从父组件传入，避免重复获取）
  initialConfig?: DatasourceConfig | null;
  onConfigChange?: (config: DatasourceConfig) => void;
}

const DatasourceConfigPanel: React.FC<DatasourceConfigPanelProps> = ({
  componentId,
  componentDefinition,
  datasets: datasetsProp = [],
  initialConfig,
  onConfigChange,
}) => {
  const [sourceType, setSourceType] = useState<'dataset' | 'static'>('dataset');
  const [bindingType, setBindingType] = useState<'dataset' | 'static'>('dataset');
  const [staticDataJson, setStaticDataJson] = useState<string>('[]');
  const [jsonModalVisible, setJsonModalVisible] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>(datasetsProp);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [datasetModalVisible, setDatasetModalVisible] = useState(false);
  const [pendingDatasetId, setPendingDatasetId] = useState<string>('');
  const [modalSelectedDatasetId, setModalSelectedDatasetId] = useState<string>('');
  const [modalFields, setModalFields] = useState<DatasetField[]>([]);
  const [modalLoadingFields, setModalLoadingFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasLoadedStaticConfigRef = useRef(false);

  // 当从父组件传入的数据集列表更新时，同步更新本地状态
  useEffect(() => {
    if (datasetsProp.length > 0) {
      setDatasets(datasetsProp);
    }
  }, [datasetsProp]);


  // 使用 ref 存储上一次的 componentId 和 initialConfig，避免不必要的重新加载
  const prevComponentIdRef = useRef<string | undefined>(undefined);
  const prevInitialConfigRef = useRef<string | null>(null);

  // 加载组件数据源配置
  useEffect(() => {
    if (!componentId) {
      // 如果没有 componentId，重置所有状态
      setSourceType('dataset');
      setBindingType('dataset');
      setSelectedDatasetId('');
      setStaticDataJson('[]');
      hasLoadedStaticConfigRef.current = false;
      prevComponentIdRef.current = undefined;
      prevInitialConfigRef.current = null;
      return;
    }
    
    // 检查 componentId 和 initialConfig 是否变化
    const componentIdChanged = prevComponentIdRef.current !== componentId;
    const initialConfigString = initialConfig ? JSON.stringify(initialConfig) : null;
    const initialConfigChanged = prevInitialConfigRef.current !== initialConfigString;
    
    // 如果 componentId 和 initialConfig 都没有变化，跳过重新加载
    if (!componentIdChanged && !initialConfigChanged && prevComponentIdRef.current !== undefined) {
      return;
    }
    
    prevComponentIdRef.current = componentId;
    prevInitialConfigRef.current = initialConfigString;
    
    // 如果提供了初始配置，优先使用初始配置
    if (initialConfig) {
      setSourceType(initialConfig.sourceType || 'dataset');
      setBindingType(initialConfig.bindingType || 'dataset');
      if (initialConfig.datasetConfig) {
        const datasetId = initialConfig.datasetConfig.datasetId || '';
        
        // 获取上一次的 datasetId
        const prevDatasetId = prevInitialConfigRef.current 
          ? JSON.parse(prevInitialConfigRef.current)?.datasetConfig?.datasetId 
          : undefined;
        const datasetIdChanged = prevDatasetId !== datasetId;
        
        // 设置 selectedDatasetId，确保数据集正确显示
        // 如果 datasetId 变化或还没有选择数据集，需要设置
        if (componentIdChanged || datasetIdChanged || !selectedDatasetId) {
          setSelectedDatasetId(datasetId);
        }
      } else {
        if (componentIdChanged) {
          setSelectedDatasetId('');
        }
      }
      if (initialConfig.staticConfig) {
        setStaticDataJson(JSON.stringify(initialConfig.staticConfig.data, null, 2));
        hasLoadedStaticConfigRef.current = true;
      } else {
        hasLoadedStaticConfigRef.current = false;
        setStaticDataJson('[]');
      }
      setLoading(false);
      return;
    }
    
    // 先重置所有状态，避免显示上一个组件的数据
    setSourceType('dataset');
    setBindingType('dataset');
    setSelectedDatasetId('');
    setStaticDataJson('[]');
    hasLoadedStaticConfigRef.current = false;
    setLoading(false);
  }, [componentId, initialConfig]);

  const defaultStaticJson = useMemo(() => {
    if (componentDefinition?.defaultData && Array.isArray(componentDefinition.defaultData)) {
      return JSON.stringify(componentDefinition.defaultData, null, 2);
    }
    return '[]';
  }, [componentDefinition]);

  useEffect(() => {
    if (hasLoadedStaticConfigRef.current) {
      return;
    }
    setStaticDataJson(defaultStaticJson);
  }, [defaultStaticJson]);

  const ensureStaticJsonInitialized = useCallback(() => {
    if (hasLoadedStaticConfigRef.current) {
      return;
    }
    const trimmed = staticDataJson.trim();
    if (trimmed !== '' && trimmed !== '[]') {
      return;
    }
    setStaticDataJson(defaultStaticJson);
  }, [defaultStaticJson, staticDataJson]);

  const getParsedStaticData = () => {
    try {
      const data = JSON.parse(staticDataJson);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      return [];
    }
  };


  // 绑定方式选择
  const handleBindingTypeChange = async (value: 'dataset' | 'static') => {
    setBindingType(value);
    if (value === 'static') {
      ensureStaticJsonInitialized();
    }
    const newConfig: DatasourceConfig = {
      sourceType,
      bindingType: value,
      ...(value === 'static' ? { staticConfig: { data: getParsedStaticData() } } : {}),
    };
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  // 数据集选择
  const handleDatasetSelect = (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    // 不清空 xAxisField 和 yAxisField，保留用户已选择的值
    const dataset = datasets.find((d) => d.datasetId === datasetId);
    if (dataset) {
      const newConfig: DatasourceConfig = {
        sourceType,
        bindingType: 'dataset',
        datasetConfig: {
          datasetId: dataset.datasetId,
          datasourceId: dataset.datasourceId || '',
          // 保留已有的 xAxisField 和 yAxisField 值
          xAxisField: initialConfig?.datasetConfig?.xAxisField || '',
          yAxisField: initialConfig?.datasetConfig?.yAxisField || '',
        },
      };
      if (onConfigChange) {
        onConfigChange(newConfig);
      }
      // 不自动保存，等待应用按钮
      // if (componentId) {
      //   datasourceApi.saveComponentDatasourceConfig(componentId, newConfig);
      // }
    }
  };


  const selectedDatasetName = useMemo(() => {
    if (!selectedDatasetId) {
      return '';
    }
    const dataset = datasets.find((d) => d.datasetId === selectedDatasetId);
    if (dataset) {
      return dataset.datasetName;
    }
    return '';
  }, [datasets, selectedDatasetId]);

  const staticValueSummary = useMemo(() => {
    try {
      const data = JSON.parse(staticDataJson);
      if (Array.isArray(data) && data.length > 0) {
        return `已配置 ${data.length} 条记录`;
      }
      if (Array.isArray(data)) {
        return '尚未配置数据';
      }
      return 'JSON 数据需为数组';
    } catch (error) {
      return 'JSON 格式错误';
    }
  }, [staticDataJson]);

  // 构建数据集树形结构
  const datasetTreeData = useMemo<DataNode[]>(() => {
    return datasets.map((dataset) => ({
      title: dataset.datasetName,
      key: dataset.datasetId,
      isLeaf: true,
    }));
  }, [datasets]);

  // 构建字段表格数据（树形结构：维度/度量分组）
  const fieldTableData = useMemo(() => {
    const dimensionFields = modalFields.filter((f) => f.tag === 'dimension');
    const measureFields = modalFields.filter((f) => f.tag === 'measure');

    const buildChildren = (fields: DatasetField[]) => {
      return fields.map((field) => ({
        key: field.fieldId,
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType,
        tag: field.tag,
        description: field.description || '',
      }));
    };

    const treeData: any[] = [];

    // 维度分组
    if (dimensionFields.length > 0) {
      treeData.push({
        key: 'dimension-group',
        fieldLabel: '维度',
        fieldType: '',
        description: '',
        children: buildChildren(dimensionFields),
      });
    }

    // 度量分组
    if (measureFields.length > 0) {
      treeData.push({
        key: 'measure-group',
        fieldLabel: '度量',
        fieldType: '',
        description: '',
        children: buildChildren(measureFields),
      });
    }

    return treeData;
  }, [modalFields]);

  // 字段表格列定义
  const fieldColumns = [
    {
      title: '业务名称',
      dataIndex: 'fieldLabel',
      key: 'fieldLabel',
      width: 200,
    },
    {
      title: '数据类型',
      dataIndex: 'fieldType',
      key: 'fieldType',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  // 树节点选择处理
  const handleTreeSelect = async (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) {
      setModalSelectedDatasetId('');
      setModalFields([]);
      return;
    }

    const datasetId = selectedKeys[0] as string;
    setModalSelectedDatasetId(datasetId);
    setPendingDatasetId(datasetId);

    // 加载字段
    setModalLoadingFields(true);
    try {
      const response = await datasourceApi.getDatasetFields(datasetId);
      if (response.success && response.data) {
        setModalFields(response.data);
      } else {
        message.error('加载字段失败');
        setModalFields([]);
      }
    } catch (error) {
      message.error('加载字段失败');
      setModalFields([]);
    } finally {
      setModalLoadingFields(false);
    }
  };

  const openDatasetSelector = () => {
    setPendingDatasetId(selectedDatasetId);
    setModalSelectedDatasetId(selectedDatasetId);
    setDatasetModalVisible(true);
    
    // 如果已有选中的数据集，加载字段
    if (selectedDatasetId) {
      handleTreeSelect([selectedDatasetId]);
    } else {
      setModalFields([]);
    }
  };

  const handleDatasetConfirm = () => {
    if (!pendingDatasetId) {
      message.error('请选择数据集');
      return;
    }
    handleDatasetSelect(pendingDatasetId);
    setDatasetModalVisible(false);
  };

  // 静态配置JSON编辑
  const handleStaticConfigSave = () => {
    try {
      const data = JSON.parse(staticDataJson);
      if (!Array.isArray(data)) {
        message.error('JSON数据必须是数组格式');
        return;
      }
      const newConfig: DatasourceConfig = {
        sourceType,
        bindingType: 'static',
        staticConfig: { data },
      };
      if (onConfigChange) {
        onConfigChange(newConfig);
      }
      // 不自动保存，等待应用按钮
      // if (componentId) {
      //   datasourceApi.saveComponentDatasourceConfig(componentId, newConfig);
      // }
      setJsonModalVisible(false);
      hasLoadedStaticConfigRef.current = true;
      message.success('静态配置已更新');
    } catch (error) {
      message.error('JSON格式错误，请检查输入');
    }
  };

  if (!componentId) {
    return <Empty description="请选择画布中的组件实例" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <>
      <Form layout="vertical" size="small">
        <Form.Item label="绑定方式" className="config-item" required>
          <Select
            value={bindingType}
            onChange={handleBindingTypeChange}
            options={[
              { label: '数据集', value: 'dataset' },
              { label: '静态配置', value: 'static' },
            ]}
          />
          <div className="config-item-description">选择数据绑定方式：数据集或静态配置</div>
        </Form.Item>

        {bindingType === 'dataset' && (
          <>
            <Form.Item label="数据集" className="config-item" required>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder="请选择数据集"
                  value={selectedDatasetName}
                  readOnly
                  style={{ flex: 1, minWidth: 0 }}
                />
                <Button type="primary" onClick={openDatasetSelector} style={{ width: 80, flexShrink: 0 }}>
                  选择
                </Button>
              </div>
              {!selectedDatasetId && (
                <div className="config-item-description" style={{ color: '#f5222d' }}>请选择数据集</div>
              )}
              {selectedDatasetId && (
                <div className="config-item-description">已选择数据集：{selectedDatasetName}</div>
              )}
            </Form.Item>
          </>
        )}

        {bindingType === 'static' && (
          <Form.Item label="值" className="config-item" required>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input value={staticValueSummary} readOnly style={{ flex: 1 }} />
              <Button
                type="primary"
                onClick={() => {
                  ensureStaticJsonInitialized();
                  setJsonModalVisible(true);
                }}
                style={{ width: 80, flexShrink: 0 }}
              >
                配置
              </Button>
            </div>
            <div className="config-item-description">{staticValueSummary}</div>
          </Form.Item>
        )}
      </Form>

      <Modal
        title="选择数据集"
        open={datasetModalVisible}
        onOk={handleDatasetConfirm}
        onCancel={() => {
          setDatasetModalVisible(false);
          setModalSelectedDatasetId('');
          setModalFields([]);
        }}
        okText="确定"
        cancelText="取消"
        width={900}
        okButtonProps={{ disabled: !pendingDatasetId }}
      >
        <div style={{ display: 'flex', gap: 16, height: 500 }}>
          {/* 左侧：数据集树 */}
          <div style={{ width: 200, borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>数据集列表</div>
            <Tree
              treeData={datasetTreeData}
              selectedKeys={modalSelectedDatasetId ? [modalSelectedDatasetId] : []}
              onSelect={handleTreeSelect}
              defaultExpandAll
              style={{ overflow: 'auto', height: 'calc(100% - 40px)' }}
            />
          </div>

          {/* 右侧：字段列表 */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ marginBottom: 12, fontWeight: 500 }}>
              字段列表
              {modalSelectedDatasetId && (
                <span style={{ marginLeft: 8, color: '#999', fontWeight: 'normal' }}>
                  ({datasets.find((d) => d.datasetId === modalSelectedDatasetId)?.datasetName})
                </span>
              )}
            </div>
            {!modalSelectedDatasetId ? (
              <Empty
                description="请从左侧选择数据集"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginTop: 100 }}
              />
            ) : modalLoadingFields ? (
              <div style={{ textAlign: 'center', paddingTop: 100 }}>加载中...</div>
            ) : fieldTableData.length === 0 ? (
              <Empty
                description="该数据集暂无字段"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginTop: 100 }}
              />
            ) : (
              <Table
                columns={fieldColumns}
                dataSource={fieldTableData}
                pagination={false}
                scroll={{ y: 420 }}
                size="small"
                rowKey="key"
                defaultExpandAllRows={false}
              />
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="静态数据配置"
        open={jsonModalVisible}
        onOk={handleStaticConfigSave}
        onCancel={() => setJsonModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form.Item label="JSON数据格式">
          <TextArea
            rows={12}
            value={staticDataJson}
            onChange={(e) => setStaticDataJson(e.target.value)}
            placeholder='请输入JSON格式数据，例如：[{"name": "分类A", "value": 100}]'
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>
        <div style={{ fontSize: 12, color: '#999', marginTop: -16, marginBottom: 16 }}>
          提示：JSON数据必须是数组格式
        </div>
      </Modal>
    </>
  );
};

export default DatasourceConfigPanel;
