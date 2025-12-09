import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Radio, Space, Button, Table } from 'antd';
import type { DynamicEventConfig } from '../../../types';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface DynamicEventConfigProps {
  config?: DynamicEventConfig | null;
  onChange?: (config: DynamicEventConfig) => void;
}

/**
 * 动态事件配置组件
 */
const DynamicEventConfig: React.FC<DynamicEventConfigProps> = ({ config, onChange }) => {
  const [apiUrl, setApiUrl] = useState<string>(config?.apiUrl || '');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(config?.method || 'GET');
  const [headers, setHeaders] = useState<Record<string, string>>(config?.headers || {});
  const [body, setBody] = useState<string>(config?.body ? JSON.stringify(config.body, null, 2) : '');
  const [authType, setAuthType] = useState<'bearer' | 'apikey' | 'basic' | 'none'>(
    config?.auth?.type || 'none'
  );
  const [authConfig, setAuthConfig] = useState<any>(config?.auth?.config || {});
  const [paramMappings, setParamMappings] = useState<Array<{ source: string; target: string }>>(
    config?.paramMapping || []
  );

  // 当config变化时更新状态
  useEffect(() => {
    if (config) {
      setApiUrl(config.apiUrl || '');
      setMethod(config.method || 'GET');
      setHeaders(config.headers || {});
      setBody(config.body ? JSON.stringify(config.body, null, 2) : '');
      setAuthType(config.auth?.type || 'none');
      setAuthConfig(config.auth?.config || {});
      setParamMappings(config.paramMapping || []);
    }
  }, [config]);

  // 触发配置变更
  const triggerChange = (updates: Partial<DynamicEventConfig>) => {
    let parsedBody: any = undefined;
    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        // JSON格式错误时暂不更新body，使用之前的body值
        if (config?.body) {
          parsedBody = config.body;
        }
      }
    }
    const newConfig: DynamicEventConfig = {
      apiUrl: updates.apiUrl !== undefined ? updates.apiUrl : apiUrl,
      method: updates.method !== undefined ? updates.method : method,
      headers: updates.headers !== undefined ? updates.headers : headers,
      body: updates.body !== undefined ? updates.body : parsedBody,
      ...(authType !== 'none' ? { auth: { type: authType, config: authConfig } } : {}),
      paramMapping: updates.paramMapping !== undefined ? updates.paramMapping : paramMappings,
    };
    if (onChange) {
      onChange(newConfig);
    }
  };

  // API URL变更
  const handleApiUrlChange = (value: string) => {
    setApiUrl(value);
    triggerChange({ apiUrl: value });
  };

  // HTTP方法变更
  const handleMethodChange = (value: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
    setMethod(value);
    triggerChange({ method: value });
  };

  // 请求头变更
  const handleHeaderChange = (key: string, value: string) => {
    const newHeaders = { ...headers, [key]: value };
    setHeaders(newHeaders);
    triggerChange({ headers: newHeaders });
  };

  // 请求体变更
  const handleBodyChange = (value: string) => {
    setBody(value);
    try {
      const parsed = JSON.parse(value);
      triggerChange({ body: parsed });
    } catch {
      // JSON格式错误时暂不更新
    }
  };

  // 认证类型变更
  const handleAuthTypeChange = (value: 'bearer' | 'apikey' | 'basic' | 'none') => {
    setAuthType(value);
    setAuthConfig({});
    triggerChange({
      auth: value !== 'none' ? { type: value, config: {} } : undefined,
    });
  };

  // 认证配置变更
  const handleAuthConfigChange = (key: string, value: string) => {
    const newAuthConfig = { ...authConfig, [key]: value };
    setAuthConfig(newAuthConfig);
    triggerChange({
      auth: { type: authType, config: newAuthConfig },
    });
  };

  // 添加参数映射
  const handleAddParamMapping = () => {
    const newMappings = [...paramMappings, { source: '', target: '' }];
    setParamMappings(newMappings);
    triggerChange({ paramMapping: newMappings });
  };

  // 删除参数映射
  const handleDeleteParamMapping = (index: number) => {
    const newMappings = paramMappings.filter((_, i) => i !== index);
    setParamMappings(newMappings);
    triggerChange({ paramMapping: newMappings });
  };

  // 更新参数映射
  const handleParamMappingChange = (index: number, field: 'source' | 'target', value: string) => {
    const newMappings = [...paramMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setParamMappings(newMappings);
    triggerChange({ paramMapping: newMappings });
  };

  return (
    <div>
      <Form layout="vertical">
        <Form.Item label="API URL" required>
          <Input
            value={apiUrl}
            onChange={(e) => handleApiUrlChange(e.target.value)}
            placeholder="https://api.example.com/endpoint"
          />
        </Form.Item>

        <Form.Item label="HTTP方法">
          <Select
            value={method}
            onChange={handleMethodChange}
            options={[
              { label: 'GET', value: 'GET' },
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' },
              { label: 'DELETE', value: 'DELETE' },
            ]}
          />
        </Form.Item>

        <Collapse
          items={[
            {
              key: 'headers',
              label: '请求头',
              children: (
                <div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {Object.entries(headers).map(([key, value]) => (
                      <Space key={key} style={{ width: '100%' }}>
                        <Input
                          placeholder="Header名称"
                          value={key}
                          onChange={(e) => {
                            const newHeaders = { ...headers };
                            delete newHeaders[key];
                            newHeaders[e.target.value] = value;
                            setHeaders(newHeaders);
                            triggerChange({ headers: newHeaders });
                          }}
                          style={{ width: '40%' }}
                        />
                        <Input
                          placeholder="Header值"
                          value={value}
                          onChange={(e) => handleHeaderChange(key, e.target.value)}
                          style={{ width: '40%' }}
                        />
                        <Button
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            const newHeaders = { ...headers };
                            delete newHeaders[key];
                            setHeaders(newHeaders);
                            triggerChange({ headers: newHeaders });
                          }}
                        />
                      </Space>
                    ))}
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => {
                        const newHeaders = { ...headers, '': '' };
                        setHeaders(newHeaders);
                        triggerChange({ headers: newHeaders });
                      }}
                    >
                      添加请求头
                    </Button>
                  </Space>
                </div>
              ),
            },
            {
              key: 'auth',
              label: '认证配置',
              children: (
                <div>
                  <Form.Item label="认证类型">
                    <Radio.Group
                      value={authType}
                      onChange={(e) => handleAuthTypeChange(e.target.value)}
                    >
                      <Radio value="none">无认证</Radio>
                      <Radio value="bearer">Bearer Token</Radio>
                      <Radio value="apikey">API Key</Radio>
                      <Radio value="basic">Basic Auth</Radio>
                    </Radio.Group>
                  </Form.Item>

                  {authType === 'bearer' && (
                    <Form.Item label="Token">
                      <Input
                        type="password"
                        value={authConfig.token || ''}
                        onChange={(e) => handleAuthConfigChange('token', e.target.value)}
                        placeholder="请输入Bearer Token"
                      />
                    </Form.Item>
                  )}

                  {authType === 'apikey' && (
                    <>
                      <Form.Item label="API Key">
                        <Input
                          type="password"
                          value={authConfig.apiKey || ''}
                          onChange={(e) => handleAuthConfigChange('apiKey', e.target.value)}
                          placeholder="请输入API Key"
                        />
                      </Form.Item>
                      <Form.Item label="API Key Header名称">
                        <Input
                          value={authConfig.apiKeyHeader || 'X-API-Key'}
                          onChange={(e) => handleAuthConfigChange('apiKeyHeader', e.target.value)}
                          placeholder="X-API-Key"
                        />
                      </Form.Item>
                    </>
                  )}

                  {authType === 'basic' && (
                    <>
                      <Form.Item label="用户名">
                        <Input
                          value={authConfig.username || ''}
                          onChange={(e) => handleAuthConfigChange('username', e.target.value)}
                          placeholder="请输入用户名"
                        />
                      </Form.Item>
                      <Form.Item label="密码">
                        <Input
                          type="password"
                          value={authConfig.password || ''}
                          onChange={(e) => handleAuthConfigChange('password', e.target.value)}
                          placeholder="请输入密码"
                        />
                      </Form.Item>
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'body',
              label: '请求体',
              children: (
                <Form.Item>
                  <TextArea
                    rows={6}
                    value={body}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    placeholder='请输入JSON格式的请求体，例如：{"key": "value"}'
                    style={{ fontFamily: 'monospace' }}
                  />
                </Form.Item>
              ),
            },
            {
              key: 'paramMapping',
              label: '参数映射',
              children: (
                <div>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={handleAddParamMapping}
                    style={{ marginBottom: 16 }}
                  >
                    添加参数映射
                  </Button>
                  {paramMappings.length > 0 && (
                    <Table
                      dataSource={paramMappings.map((item, index) => ({ ...item, key: index }))}
                      columns={[
                        {
                          title: '数据来源',
                          dataIndex: 'source',
                          render: (text, record, index) => (
                            <Input
                              value={text}
                              onChange={(e) =>
                                handleParamMappingChange(index, 'source', e.target.value)
                              }
                              placeholder="例如：$event.data.value"
                            />
                          ),
                        },
                        {
                          title: '目标参数名',
                          dataIndex: 'target',
                          render: (text, record, index) => (
                            <Input
                              value={text}
                              onChange={(e) =>
                                handleParamMappingChange(index, 'target', e.target.value)
                              }
                              placeholder="例如：value"
                            />
                          ),
                        },
                        {
                          title: '操作',
                          render: (_, record, index) => (
                            <Button
                              icon={<DeleteOutlined />}
                              danger
                              onClick={() => handleDeleteParamMapping(index)}
                            />
                          ),
                        },
                      ]}
                      pagination={false}
                      size="small"
                    />
                  )}
                </div>
              ),
            },
          ]}
        />

        {(method === 'POST' || method === 'PUT') && (
          <Form.Item label="请求体">
            <TextArea
              rows={6}
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder='请输入JSON格式的请求体，例如：{"key": "value"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export default DynamicEventConfig;

