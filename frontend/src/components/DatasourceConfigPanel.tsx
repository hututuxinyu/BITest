import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Form, Select, Button, Modal, Input, message, Empty } from 'antd';
import type { ComponentDefinition, DatasourceConfig, Dataset } from '../types';
import { datasourceApi } from '../services/datasourceApi';

const { TextArea } = Input;

interface DatasourceConfigPanelProps {
  componentId?: string;
  componentDefinition?: ComponentDefinition | null;
  onConfigChange?: (config: DatasourceConfig) => void;
}

/**
 * 数据源配置面板组件
 */
const DatasourceConfigPanel: React.FC<DatasourceConfigPanelProps> = ({
  componentId,
  componentDefinition,
  onConfigChange,
}) => {
  const [sourceType, setSourceType] = useState<'dataset' | 'static'>('dataset');
  const [bindingType, setBindingType] = useState<'dataset' | 'static'>('dataset');
  const [staticDataJson, setStaticDataJson] = useState<string>('[]');
  const [jsonModalVisible, setJsonModalVisible] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [datasetModalVisible, setDatasetModalVisible] = useState(false);
  const [pendingDatasetId, setPendingDatasetId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const hasLoadedStaticConfigRef = useRef(false);

  // 加载数据集列表
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response = await datasourceApi.getDatasetList();
        if (response.success && response.data) {
          setDatasets(response.data);
        }
      } catch (error) {
        message.error('加载数据集列表失败');
      }
    };
    loadDatasets();
  }, []);

  // 加载组件数据源配置
  useEffect(() => {
    if (!componentId) {
      return;
    }
    const loadConfig = async () => {
      setLoading(true);
      try {
        const response = await datasourceApi.getComponentDatasourceConfig(componentId);
        if (response.success && response.data) {
          const config = response.data;
          setSourceType(config.sourceType);
          setBindingType(config.bindingType);
          if (config.datasetConfig) {
            setSelectedDatasetId(config.datasetConfig.datasourceId);
          }
          if (config.staticConfig) {
            setStaticDataJson(JSON.stringify(config.staticConfig.data, null, 2));
            hasLoadedStaticConfigRef.current = true;
          } else {
            hasLoadedStaticConfigRef.current = false;
            setStaticDataJson('[]');
          }
        }
      } catch (error) {
        message.error('加载数据源配置失败');
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [componentId]);

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

  // 数据来源选择
  const handleSourceTypeChange = (value: 'dataset' | 'static') => {
    setSourceType(value);
    setBindingType(value);
    if (value === 'static') {
      ensureStaticJsonInitialized();
    }
    const newConfig: DatasourceConfig = {
      sourceType: value,
      bindingType: value,
      ...(value === 'static' ? { staticConfig: { data: getParsedStaticData() } } : {}),
    };
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
    if (componentId) {
      datasourceApi.saveComponentDatasourceConfig(componentId, newConfig);
    }
  };

  // 绑定方式选择
  const handleBindingTypeChange = (value: 'dataset' | 'static') => {
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
    if (componentId) {
      datasourceApi.saveComponentDatasourceConfig(componentId, newConfig);
    }
  };

  // 数据集选择
  const handleDatasetSelect = (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    const dataset = datasets.find((d) => d.datasetId === datasetId);
    if (dataset) {
      const newConfig: DatasourceConfig = {
        sourceType,
        bindingType: 'dataset',
        datasetConfig: {
          datasourceId: dataset.datasourceId,
          query: dataset.query || '',
        },
      };
      if (onConfigChange) {
        onConfigChange(newConfig);
      }
      if (componentId) {
        datasourceApi.saveComponentDatasourceConfig(componentId, newConfig);
      }
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

  const openDatasetSelector = () => {
    setPendingDatasetId(selectedDatasetId);
    setDatasetModalVisible(true);
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
      if (componentId) {
        datasourceApi.saveComponentDatasourceConfig(componentId, newConfig);
      }
      setJsonModalVisible(false);
      hasLoadedStaticConfigRef.current = true;
      message.success('静态配置保存成功');
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
          <Form.Item label="数据集" className="config-item" required>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                placeholder="请选择数据集"
                value={selectedDatasetName}
                status={!selectedDatasetId ? 'error' : undefined}
                readOnly
                style={{ flex: 1 }}
              />
              <Button type="primary" onClick={openDatasetSelector}>
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
        onCancel={() => setDatasetModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form layout="vertical" size="small">
          <Form.Item label="数据集" required>
            <Select
              placeholder="请选择数据集"
              value={pendingDatasetId}
              onChange={(val) => setPendingDatasetId(val)}
              options={datasets.map((dataset) => ({
                label: dataset.datasetName,
                value: dataset.datasetId,
              }))}
            />
          </Form.Item>
        </Form>
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

