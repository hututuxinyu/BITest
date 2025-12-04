import React, { useState, useEffect } from 'react';
import { Form, Select, message, Button, Card } from 'antd';
import { SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DatasourceConfig, Dataset, DatasetField, ComponentDefinition, TableColumn } from '../../types';
import { datasourceApi } from '../../services/datasourceApi';
import TableColumnConfigModal from './TableColumnConfigModal';

interface DataBindingPanelProps {
  componentId?: string;
  componentDefinition?: ComponentDefinition | null;
  selectedDatasetId?: string; // 可选，如果未提供则从 initialConfig 中读取
  datasets: Dataset[];
  initialConfig?: DatasourceConfig | null;
  onConfigChange?: (config: DatasourceConfig) => void;
}

/**
 * 数据绑定面板组件
 * 用于配置X轴和Y轴字段（图表组件）或表格列（表格组件）
 */
const DataBindingPanel: React.FC<DataBindingPanelProps> = ({
  componentId,
  componentDefinition,
  selectedDatasetId: selectedDatasetIdProp,
  datasets,
  initialConfig,
  onConfigChange,
}) => {
  // 判断是否是表格组件
  const isTableComponent = componentId === 'chart-table' || componentId === 'chart-tree-table';

  // 从 initialConfig 或 prop 中获取 selectedDatasetId（优先使用 initialConfig，因为它总是最新的）
  const selectedDatasetId = initialConfig?.datasetConfig?.datasetId || selectedDatasetIdProp || '';

  // 表格列配置相关状态
  const [tableColumnModalVisible, setTableColumnModalVisible] = useState(false);
  const [allFields, setAllFields] = useState<DatasetField[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [dimensionFields, setDimensionFields] = useState<DatasetField[]>([]);
  const [measureFields, setMeasureFields] = useState<DatasetField[]>([]);
  const [xAxisField, setXAxisField] = useState<string>('');
  const [yAxisField, setYAxisField] = useState<string>('');
  const [loadingFields, setLoadingFields] = useState(false);

  // 从 initialConfig 中获取 sourceType
  const sourceType = initialConfig?.sourceType || 'dataset';

  // 初始化：从 initialConfig 中读取已保存的配置（当组件切换或配置变化时）
  useEffect(() => {
    // 当 initialConfig 变化时（组件切换），立即从配置中读取字段值
    if (initialConfig?.datasetConfig) {
      const configDatasetId = initialConfig.datasetConfig.datasetId || '';
      const configXAxisField = initialConfig.datasetConfig.xAxisField || '';
      const configYAxisField = initialConfig.datasetConfig.yAxisField || '';
      const configTableColumns = initialConfig.datasetConfig.tableColumns || [];

      // 只有当 selectedDatasetId 与配置中的 datasetId 匹配时，才设置字段值
      // selectedDatasetId 是从 initialConfig 中获取的，所以应该总是匹配的
      if (configDatasetId === selectedDatasetId || (!selectedDatasetId && configDatasetId)) {
        if (isTableComponent) {
          // 表格组件：设置表格列配置
          setTableColumns(configTableColumns);
        } else {
          // 图表组件：设置X轴和Y轴字段（即使字段列表还没加载，先设置值）
          setXAxisField(configXAxisField);
          setYAxisField(configYAxisField);
        }
      } else if (!configDatasetId) {
        // 如果配置中没有数据集ID，清空字段值
        setXAxisField('');
        setYAxisField('');
        setTableColumns([]);
      }
    } else {
      // 如果没有配置，清空所有字段值
      setXAxisField('');
      setYAxisField('');
      setTableColumns([]);
    }
  }, [initialConfig, selectedDatasetId, isTableComponent]);

  // 加载数据集字段
  useEffect(() => {
    if (!selectedDatasetId) {
      setDimensionFields([]);
      setMeasureFields([]);
      setAllFields([]);
      // 不清空字段值，保留已保存的配置
      return;
    }

    const loadFields = async () => {
      setLoadingFields(true);
      try {
        if (isTableComponent) {
          // 表格组件：加载所有字段
          const response = await datasourceApi.getDatasetFields(selectedDatasetId);
          if (response.success && response.data) {
            setAllFields(response.data);
          }
        } else {
          // 图表组件：加载维度和度量字段
          const [dimensionRes, measureRes] = await Promise.all([
            datasourceApi.getDatasetFieldsByTag(selectedDatasetId, 'dimension'),
            datasourceApi.getDatasetFieldsByTag(selectedDatasetId, 'measure'),
          ]);

          if (dimensionRes.success && dimensionRes.data) {
            setDimensionFields(dimensionRes.data);
          }
          if (measureRes.success && measureRes.data) {
            setMeasureFields(measureRes.data);
          }

          // 字段加载完成后，验证并设置字段值
          // 确保配置中的字段值在字段列表中存在
          if (initialConfig?.datasetConfig?.datasetId === selectedDatasetId) {
            const xAxisFieldValue = initialConfig.datasetConfig.xAxisField || '';
            const yAxisFieldValue = initialConfig.datasetConfig.yAxisField || '';
            
            // 验证字段值是否在字段列表中
            // 只有在字段列表加载成功且字段值不在列表中时，才清空
            if (xAxisFieldValue) {
              if (dimensionRes.success && dimensionRes.data) {
                const fieldExists = dimensionRes.data.some(
                  (f) => f.fieldName === xAxisFieldValue
                );
                if (fieldExists) {
                  setXAxisField(xAxisFieldValue);
                } else {
                  // 字段不存在于列表中，清空
                  setXAxisField('');
                }
              }
              // 如果字段列表加载失败，保留配置中的字段值
            }
            if (yAxisFieldValue) {
              if (measureRes.success && measureRes.data) {
                const fieldExists = measureRes.data.some(
                  (f) => f.fieldName === yAxisFieldValue
                );
                if (fieldExists) {
                  setYAxisField(yAxisFieldValue);
                } else {
                  // 字段不存在于列表中，清空
                  setYAxisField('');
                }
              }
              // 如果字段列表加载失败，保留配置中的字段值
            }
          }
        }
      } catch (error) {
        message.error('加载数据集字段失败');
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, [selectedDatasetId, initialConfig, isTableComponent]);

  // X轴字段选择
  const handleXAxisFieldChange = (fieldName: string) => {
    setXAxisField(fieldName);
    const newConfig: DatasourceConfig = {
      sourceType,
      bindingType: 'dataset',
      datasetConfig: {
        datasetId: selectedDatasetId,
        datasourceId: datasets.find((d) => d.datasetId === selectedDatasetId)?.datasourceId || '',
        xAxisField: fieldName,
        yAxisField: yAxisField,
      },
    };
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  // Y轴字段选择
  const handleYAxisFieldChange = (fieldName: string) => {
    setYAxisField(fieldName);
    const newConfig: DatasourceConfig = {
      sourceType,
      bindingType: 'dataset',
      datasetConfig: {
        datasetId: selectedDatasetId,
        datasourceId: datasets.find((d) => d.datasetId === selectedDatasetId)?.datasourceId || '',
        xAxisField: xAxisField,
        yAxisField: fieldName,
      },
    };
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  // 表格列配置确认
  const handleTableColumnConfirm = (columns: TableColumn[]) => {
    setTableColumns(columns);
    const newConfig: DatasourceConfig = {
      sourceType,
      bindingType: 'dataset',
      datasetConfig: {
        datasetId: selectedDatasetId,
        datasourceId: datasets.find((d) => d.datasetId === selectedDatasetId)?.datasourceId || '',
        tableColumns: columns,
      },
    };
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
    setTableColumnModalVisible(false);
  };

  // 删除表格列
  const handleDeleteTableColumn = (fieldName: string) => {
    const newColumns = tableColumns.filter((col) => col.fieldName !== fieldName);
    setTableColumns(newColumns);
    const newConfig: DatasourceConfig = {
      sourceType,
      bindingType: 'dataset',
      datasetConfig: {
        datasetId: selectedDatasetId,
        datasourceId: datasets.find((d) => d.datasetId === selectedDatasetId)?.datasourceId || '',
        tableColumns: newColumns,
      },
    };
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  // 如果是表格组件，显示表格列配置按钮
  if (isTableComponent) {
    return (
      <>
        <Form layout="vertical" size="small">
          <Form.Item label="表格列配置" className="config-item" required>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setTableColumnModalVisible(true)}
              disabled={!selectedDatasetId}
              style={{ width: '100%' }}
            >
              配置表格列
            </Button>
            {!selectedDatasetId && (
              <div className="config-item-description" style={{ color: '#999' }}>
                请先选择数据集
              </div>
            )}
            {selectedDatasetId && tableColumns.length > 0 && (
              <div className="config-item-description">
                已配置 {tableColumns.length} 个表格列
              </div>
            )}
            {selectedDatasetId && tableColumns.length === 0 && (
              <div className="config-item-description" style={{ color: '#f5222d' }}>
                请配置表格列
              </div>
            )}
          </Form.Item>

          {/* 已选择的表格列列表 */}
          {tableColumns.length > 0 && (
            <Form.Item label="已选表格列" className="config-item">
              <Card
                size="small"
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
                bodyStyle={{
                  padding: '8px',
                }}
              >
                {tableColumns.map((column) => {
                  // 从 allFields 中查找字段信息
                  const field = allFields.find((f) => f.fieldName === column.fieldName);
                  // 显示优先级：columnName > fieldLabel > fieldName
                  const displayName = column.columnName || column.fieldLabel || field?.fieldLabel || field?.fieldName || column.fieldName;
                  
                  return (
                    <div
                      key={column.fieldName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        marginBottom: '4px',
                        borderRadius: '4px',
                        backgroundColor: '#fafafa',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontSize: '14px',
                          color: '#333',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        }}
                        title={displayName}
                      >
                        {displayName}
                      </span>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteTableColumn(column.fieldName)}
                        style={{
                          marginLeft: '8px',
                          flexShrink: 0,
                          width: '24px',
                          height: '24px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      />
                    </div>
                  );
                })}
              </Card>
            </Form.Item>
          )}
        </Form>

        <TableColumnConfigModal
          visible={tableColumnModalVisible}
          availableFields={allFields}
          selectedColumns={tableColumns}
          onCancel={() => setTableColumnModalVisible(false)}
          onConfirm={handleTableColumnConfirm}
        />
      </>
    );
  }

  // 图表组件：显示X轴和Y轴字段选择
  return (
    <Form layout="vertical" size="small">
      <Form.Item label="X轴字段（维度）" className="config-item" required>
        <Select
          placeholder="请选择X轴字段"
          value={xAxisField}
          onChange={handleXAxisFieldChange}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          loading={loadingFields}
          disabled={!selectedDatasetId}
          options={dimensionFields.map((field) => ({
            label: `${field.fieldLabel} (${field.fieldName})`,
            value: field.fieldName,
          }))}
        />
        {!selectedDatasetId && (
          <div className="config-item-description" style={{ color: '#999' }}>
            请先选择数据集
          </div>
        )}
        {selectedDatasetId && !xAxisField && (
          <div className="config-item-description" style={{ color: '#f5222d' }}>
            请选择X轴字段
          </div>
        )}
        {selectedDatasetId && xAxisField && (
          <div className="config-item-description">已选择X轴字段</div>
        )}
      </Form.Item>

      <Form.Item label="Y轴字段（度量）" className="config-item" required>
        <Select
          placeholder="请选择Y轴字段"
          value={yAxisField}
          onChange={handleYAxisFieldChange}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          loading={loadingFields}
          disabled={!selectedDatasetId}
          options={measureFields.map((field) => ({
            label: `${field.fieldLabel} (${field.fieldName})`,
            value: field.fieldName,
          }))}
        />
        {!selectedDatasetId && (
          <div className="config-item-description" style={{ color: '#999' }}>
            请先选择数据集
          </div>
        )}
        {selectedDatasetId && !yAxisField && (
          <div className="config-item-description" style={{ color: '#f5222d' }}>
            请选择Y轴字段
          </div>
        )}
        {selectedDatasetId && yAxisField && (
          <div className="config-item-description">已选择Y轴字段</div>
        )}
      </Form.Item>
    </Form>
  );
};

export default DataBindingPanel;

