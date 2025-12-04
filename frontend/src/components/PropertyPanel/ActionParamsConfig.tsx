import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Table, Modal, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

interface ParamItem {
  key: string;
  name: string;
  expression: string;
}

interface ActionParamsConfigProps {
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => void;
  componentId?: string; // 当前组件ID，用于获取可用的数据字段
}

/**
 * 动作参数配置组件
 * 支持配置参数表达式，如 ${data.month}, ${value[0]} 等
 */
const ActionParamsConfig: React.FC<ActionParamsConfigProps> = ({ value, onChange, componentId }) => {
  const [params, setParams] = useState<ParamItem[]>([]);
  const [paramModalVisible, setParamModalVisible] = useState(false);
  const [editingParam, setEditingParam] = useState<ParamItem | null>(null);
  const [paramForm] = Form.useForm();

  // 从 value 初始化参数列表
  useEffect(() => {
    if (value && typeof value === 'object') {
      const paramList: ParamItem[] = Object.entries(value).map(([name, expression], index) => ({
        key: `param-${index}`,
        name,
        expression: typeof expression === 'string' ? expression : JSON.stringify(expression),
      }));
      setParams(paramList);
    } else {
      setParams([]);
    }
  }, [value]);

  const handleAddParam = () => {
    setEditingParam(null);
    paramForm.resetFields();
    setParamModalVisible(true);
  };

  const handleEditParam = (param: ParamItem) => {
    setEditingParam(param);
    paramForm.setFieldsValue({
      name: param.name,
      expression: param.expression,
    });
    setParamModalVisible(true);
  };

  const handleDeleteParam = (key: string) => {
    const newParams = params.filter((p) => p.key !== key);
    setParams(newParams);
    notifyChange(newParams);
  };

  const handleParamSave = () => {
    paramForm.validateFields().then((values) => {
      const newParam: ParamItem = {
        key: editingParam?.key || `param-${Date.now()}`,
        name: values.name,
        expression: values.expression,
      };

      let newParams: ParamItem[];
      if (editingParam) {
        // 编辑
        newParams = params.map((p) => (p.key === editingParam.key ? newParam : p));
      } else {
        // 新增
        newParams = [...params, newParam];
      }

      setParams(newParams);
      notifyChange(newParams);
      setParamModalVisible(false);
      paramForm.resetFields();
    });
  };

  const notifyChange = (paramList: ParamItem[]) => {
    const paramsObj: Record<string, any> = {};
    paramList.forEach((param) => {
      paramsObj[param.name] = param.expression;
    });
    if (onChange) {
      onChange(paramsObj);
    }
  };

  const columns = [
    {
      title: '参数名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '表达式',
      dataIndex: 'expression',
      key: 'expression',
      render: (text: string) => (
        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '2px', fontSize: '12px' }}>
          {text}
        </code>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ParamItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditParam(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteParam(record.key)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 常用表达式模板
  const expressionTemplates = [
    { label: '数据字段 - ${data.field}', value: '${data.field}' },
    { label: '数据字段 - ${data.month}', value: '${data.month}' },
    { label: '数据字段 - ${data.year}', value: '${data.year}' },
    { label: '数据字段 - ${data.date}', value: '${data.date}' },
    { label: '数据字段 - ${data.category}', value: '${data.category}' },
    { label: '数组值 - ${value[0]}', value: '${value[0]}' },
    { label: '数组值 - ${value[1]}', value: '${value[1]}' },
    { label: '上下文参数 - ${context.param}', value: '${context.param}' },
    { label: '静态值（直接输入）', value: '' },
  ];

  // 参数配置示例
  const paramExamples = [
    {
      title: '下钻操作示例',
      description: '从柱状图点击下钻到明细表',
      params: {
        month: '${data.month}',
        year: '${data.year}',
      },
    },
    {
      title: '日期范围过滤示例',
      description: '从日期选择器过滤图表数据',
      params: {
        startDate: '${value[0]}',
        endDate: '${value[1]}',
      },
    },
    {
      title: '分类过滤示例',
      description: '从下拉选择器过滤数据',
      params: {
        category: '${value}',
      },
    },
    {
      title: '混合参数示例',
      description: '同时使用数据字段和静态值',
      params: {
        product: '${data.product}',
        status: 'active',
        limit: '100',
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddParam} block size="small">
          添加参数
        </Button>
      </div>

      {params.length > 0 ? (
        <Table
          columns={columns}
          dataSource={params}
          rowKey="key"
          pagination={false}
          size="small"
        />
      ) : (
        <div style={{ textAlign: 'center', color: '#999', padding: '16px 0', fontSize: '12px' }}>
          暂无参数，点击上方按钮添加
        </div>
      )}

      <Modal
        title={editingParam ? '编辑参数' : '添加参数'}
        open={paramModalVisible}
        onOk={handleParamSave}
        onCancel={() => {
          setParamModalVisible(false);
          paramForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
        width={700}
      >
        <Form form={paramForm} layout="vertical">
          <Form.Item
            name="name"
            label="参数名称"
            rules={[{ required: true, message: '请输入参数名称' }]}
          >
            <Input placeholder="例如：month, year, startDate" />
          </Form.Item>

          <Form.Item
            name="expression"
            label="参数表达式"
            rules={[{ required: true, message: '请输入参数表达式' }]}
            tooltip="支持表达式语法：${data.field}、${value[index]}、${context.param} 或直接输入静态值"
          >
            <Input.Group compact>
              <Select
                style={{ width: '40%' }}
                placeholder="选择模板"
                onChange={(val) => {
                  if (val) {
                    paramForm.setFieldsValue({ expression: val });
                  }
                }}
                allowClear
              >
                {expressionTemplates.map((template) => (
                  <Select.Option key={template.value} value={template.value}>
                    {template.label}
                  </Select.Option>
                ))}
              </Select>
              <Input
                style={{ width: '60%' }}
                placeholder='例如：${data.month} 或直接输入值'
                onChange={(e) => {
                  paramForm.setFieldsValue({ expression: e.target.value });
                }}
              />
            </Input.Group>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>表达式说明：</div>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li>
                  <code>{'${data.field}'}</code> - 从触发事件的数据中获取字段值（如点击图表的数据点）
                </li>
                <li>
                  <code>{'${value[index]}'}</code> - 从值数组中获取指定索引的值（如日期范围选择器的值）
                </li>
                <li>
                  <code>{'${context.param}'}</code> - 从上下文环境中获取参数值
                </li>
                <li>直接输入 - 静态值，如 "2024-01" 或 100</li>
              </ul>
              
              <div style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>配置示例：</div>
              <div style={{ marginTop: '4px' }}>
                {paramExamples.map((example, index) => (
                  <div key={index} style={{ marginBottom: '8px', padding: '6px', background: '#fff', borderRadius: '2px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1890ff' }}>{example.title}</div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{example.description}</div>
                    <div style={{ marginTop: '4px' }}>
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0, height: 'auto', fontSize: '11px' }}
                        onClick={() => {
                          // 填充示例参数
                          Object.entries(example.params).forEach(([name, expression]) => {
                            const existingParam = params.find((p) => p.name === name);
                            if (!existingParam) {
                              const newParam: ParamItem = {
                                key: `param-${Date.now()}-${name}`,
                                name,
                                expression: expression as string,
                              };
                              const newParams = [...params, newParam];
                              setParams(newParams);
                              notifyChange(newParams);
                            }
                          });
                          message.success('已添加示例参数');
                        }}
                      >
                        使用此示例
                      </Button>
                      <code style={{ fontSize: '10px', marginLeft: '8px', color: '#666' }}>
                        {JSON.stringify(example.params, null, 2)}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ActionParamsConfig;

