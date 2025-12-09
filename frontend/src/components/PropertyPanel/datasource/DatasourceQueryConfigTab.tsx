/*
 TODO SQL查询配置组件 - 支持SQL语法验证
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Form, Input, Select, Button, Table, Space, Modal, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { validateSqlSyntax, type SqlValidationResult } from '../../../utils/sqlValidator';

const { TextArea } = Input;

interface QueryParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  value?: any;
  source: 'static' | 'control' | 'url' | 'user';
  sourceId?: string;
}

interface DatasourceQueryConfig {
  sql?: string;
  apiUrl?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiHeaders?: Record<string, string>;
  apiBody?: any;
  filePath?: string;
  fileType?: 'csv' | 'excel' | 'json';
  parameters?: QueryParameter[];
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  fieldMapping?: Record<string, string>;
}

interface DatasourceQueryConfigTabProps {
  componentId: string;
  datasourceType?: string;
  queryConfig?: DatasourceQueryConfig;
  availableComponents?: Array<{ id: string; name: string }>; // 可用的控制类组件列表
  onChange?: (config: DatasourceQueryConfig) => void;
}

const DatasourceQueryConfigTab: React.FC<DatasourceQueryConfigTabProps> = ({
  datasourceType = 'mysql',
  queryConfig,
  availableComponents = [],
  onChange,
}) => {
  const [sql, setSql] = useState<string>(queryConfig?.sql || '');
  const [parameters, setParameters] = useState<QueryParameter[]>(queryConfig?.parameters || []);
  const [parameterModalVisible, setParameterModalVisible] = useState(false);
  const [editingParameter, setEditingParameter] = useState<QueryParameter | null>(null);
  const [parameterForm] = Form.useForm();
  const [sqlValidation, setSqlValidation] = useState<SqlValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  // 防抖定时器引用
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // SQL验证函数（防抖处理）
  const validateSql = useCallback(
    (sqlValue: string) => {
      // 清除之前的定时器
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }

      // 设置新的定时器
      validationTimerRef.current = setTimeout(async () => {
        if (!sqlValue || sqlValue.trim().length === 0) {
          setSqlValidation(null);
          return;
        }

        setValidating(true);
        try {
          // 使用前端验证
          const result = validateSqlSyntax(sqlValue, parameters);
          setSqlValidation(result);

          // 可选：调用后端API进行更严格的验证
          // const response = await datasourceApi.validateSql(sqlValue, datasourceType);
          // if (response.success && response.data) {
          //   setSqlValidation(response.data);
          // }
        } catch (error) {
          console.error('SQL验证失败:', error);
          setSqlValidation({
            valid: false,
            errors: ['SQL验证过程出错，请检查SQL语句'],
            warnings: [],
          });
        } finally {
          setValidating(false);
        }
      }, 500);
    },
    [parameters, datasourceType]
  );

  useEffect(() => {
    if (queryConfig) {
      setSql(queryConfig.sql || '');
      setParameters(queryConfig.parameters || []);
      // 初始化时验证SQL
      if (queryConfig.sql) {
        validateSql(queryConfig.sql);
      }
    }
  }, [queryConfig, validateSql]);

  // 当参数变化时重新验证SQL
  useEffect(() => {
    if (sql) {
      validateSql(sql);
    }
  }, [parameters, validateSql, sql]);

  const handleSqlChange = (value: string) => {
    setSql(value);
    notifyChange({ ...queryConfig, sql: value });
    // 触发SQL验证
    validateSql(value);
  };

  const handleAddParameter = () => {
    setEditingParameter(null);
    parameterForm.resetFields();
    setParameterModalVisible(true);
  };

  const handleEditParameter = (param: QueryParameter) => {
    setEditingParameter(param);
    parameterForm.setFieldsValue(param);
    setParameterModalVisible(true);
  };

  const handleDeleteParameter = (index: number) => {
    const newParameters = parameters.filter((_, i) => i !== index);
    setParameters(newParameters);
    notifyChange({ ...queryConfig, parameters: newParameters });
  };

  const handleParameterSave = () => {
    parameterForm.validateFields().then((values) => {
      const newParameter: QueryParameter = {
        name: values.name,
        type: values.type,
        value: values.value,
        source: values.source,
        sourceId: values.source === 'control' ? values.sourceId : undefined,
      };

      if (editingParameter) {
        // 编辑
        const index = parameters.findIndex((p) => p.name === editingParameter.name);
        const newParameters = [...parameters];
        newParameters[index] = newParameter;
        setParameters(newParameters);
        notifyChange({ ...queryConfig, parameters: newParameters });
      } else {
        // 新增
        const newParameters = [...parameters, newParameter];
        setParameters(newParameters);
        notifyChange({ ...queryConfig, parameters: newParameters });
      }

      setParameterModalVisible(false);
      parameterForm.resetFields();
    });
  };

  const notifyChange = (config: DatasourceQueryConfig) => {
    if (onChange) {
      onChange(config);
    }
  };

  const parameterColumns = [
    {
      title: '参数名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string, record: QueryParameter) => {
        const sourceLabels: Record<string, string> = {
          static: '静态值',
          control: '控制组件',
          url: 'URL参数',
          user: '用户信息',
        };
        return (
          <span>
            {sourceLabels[source] || source}
            {source === 'control' && record.sourceId && ` (${record.sourceId})`}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: QueryParameter, index: number) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditParameter(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteParameter(index)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (datasourceType === 'api' || datasourceType === 'file') {
    // API和文件数据源的配置将在后续实现
    return <div>API和文件数据源配置功能开发中...</div>;
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <Form layout="vertical" size="small">
        <Form.Item
          label="SQL查询语句"
          required
          validateStatus={sqlValidation && !sqlValidation.valid ? 'error' : sqlValidation && sqlValidation.valid ? 'success' : undefined}
          help={
            sqlValidation ? (
              <div style={{ marginTop: '8px' }}>
                {sqlValidation.valid ? (
                  <Alert
                    message="SQL语法验证通过"
                    type="success"
                    icon={<CheckCircleOutlined />}
                    showIcon
                    style={{ fontSize: '12px' }}
                  />
                ) : (
                  <Alert
                    message="SQL语法验证失败"
                    type="error"
                    icon={<CloseCircleOutlined />}
                    showIcon
                    description={
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {sqlValidation.errors.map((error, index) => (
                          <li key={index} style={{ fontSize: '12px' }}>
                            {error}
                          </li>
                        ))}
                      </ul>
                    }
                  />
                )}
                {sqlValidation.warnings.length > 0 && (
                  <Alert
                    message="警告"
                    type="warning"
                    description={
                      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {sqlValidation.warnings.map((warning, index) => (
                          <li key={index} style={{ fontSize: '12px' }}>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    }
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                提示：使用 ? 作为参数占位符，参数将按照添加顺序绑定
              </div>
            )
          }
        >
          <TextArea
            rows={8}
            value={sql}
            onChange={(e) => {
              e.stopPropagation();
              handleSqlChange(e.target.value);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
            placeholder="请输入SQL查询语句，使用 ? 作为参数占位符，例如：SELECT * FROM table WHERE date >= ? AND date <= ?"
            style={{ fontFamily: 'monospace' }}
            status={sqlValidation && !sqlValidation.valid ? 'error' : undefined}
          />
          {validating && (
            <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
              正在验证SQL语法...
            </div>
          )}
        </Form.Item>

        <Form.Item label="查询参数">
          <div style={{ marginBottom: '8px' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddParameter}
              block
            >
              添加参数
            </Button>
          </div>
          <Table
            columns={parameterColumns}
            dataSource={parameters}
            rowKey="name"
            pagination={false}
            size="small"
          />
        </Form.Item>

        <Form.Item label="字段映射（可选）">
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
            将数据源字段映射到组件需要的字段
          </div>
          {/* 字段映射配置将在后续实现 */}
        </Form.Item>
      </Form>

      <Modal
        title={editingParameter ? '编辑参数' : '添加参数'}
        open={parameterModalVisible}
        onOk={handleParameterSave}
        onCancel={() => {
          setParameterModalVisible(false);
          parameterForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={parameterForm} layout="vertical">
          <Form.Item
            name="name"
            label="参数名称"
            rules={[{ required: true, message: '请输入参数名称' }]}
          >
            <Input placeholder="例如：startDate" disabled={!!editingParameter} />
          </Form.Item>

          <Form.Item
            name="type"
            label="参数类型"
            rules={[{ required: true, message: '请选择参数类型' }]}
            initialValue="string"
          >
            <Select
              options={[
                { label: '字符串', value: 'string' },
                { label: '数字', value: 'number' },
                { label: '日期', value: 'date' },
                { label: '布尔值', value: 'boolean' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="source"
            label="参数来源"
            rules={[{ required: true, message: '请选择参数来源' }]}
            initialValue="static"
          >
            <Select
              options={[
                { label: '静态值', value: 'static' },
                { label: '控制组件', value: 'control' },
                { label: 'URL参数', value: 'url' },
                { label: '用户信息', value: 'user' },
              ]}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.source !== currentValues.source}
          >
            {({ getFieldValue }) => {
              const source = getFieldValue('source');
              if (source === 'static') {
                return (
                  <Form.Item
                    name="value"
                    label="参数值"
                    rules={[{ required: true, message: '请输入参数值' }]}
                  >
                    <Input placeholder="请输入静态参数值" />
                  </Form.Item>
                );
              }
              if (source === 'control') {
                return (
                  <Form.Item
                    name="sourceId"
                    label="来源组件ID"
                    rules={[{ required: true, message: '请选择来源组件' }]}
                  >
                    <Select placeholder="请选择控制类组件">
                      {availableComponents.map((comp) => (
                        <Select.Option key={comp.id} value={comp.id}>
                          {comp.name} ({comp.id})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DatasourceQueryConfigTab;

