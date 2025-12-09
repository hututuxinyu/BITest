import React, { useState, useEffect, } from 'react';
import { Modal, Button, Input, InputNumber, Radio } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { DatasetField } from '../../../types';
import '../styles/TableColumnConfigModal.css';

interface TableColumn {
  fieldName: string;
  fieldLabel: string;
  columnName?: string; // 列名（可编辑）
  align?: 'left' | 'center' | 'right'; // 对齐方式
  width?: number; // 列宽
}

interface TableColumnConfigModalProps {
  visible: boolean;
  availableFields: DatasetField[]; // 可选字段列表
  selectedColumns?: TableColumn[]; // 已选列配置
  onCancel: () => void;
  onConfirm: (columns: TableColumn[]) => void;
}

/**
 * 表格列配置弹窗组件
 */
const TableColumnConfigModal: React.FC<TableColumnConfigModalProps> = ({
  visible,
  availableFields,
  selectedColumns = [],
  onCancel,
  onConfirm,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // 当前步骤：1-选择表格列，2-配置表格列
  const [availableFieldsList, setAvailableFieldsList] = useState<DatasetField[]>([]); // 左侧可选字段
  const [selectedFieldsList, setSelectedFieldsList] = useState<DatasetField[]>([]); // 右侧已选字段
  const [leftSelectedKeys, setLeftSelectedKeys] = useState<string[]>([]); // 左侧选中项
  const [rightSelectedKeys, setRightSelectedKeys] = useState<string[]>([]); // 右侧选中项
  const [columnConfigs, setColumnConfigs] = useState<TableColumn[]>([]); // 列配置

  // 初始化字段列表
  useEffect(() => {
    if (visible) {
      // 从 selectedColumns 中提取已选字段
      const selectedFieldNames = selectedColumns.map((col) => col.fieldName);
      const selected = availableFields.filter((field) => selectedFieldNames.includes(field.fieldName));
      const available = availableFields.filter((field) => !selectedFieldNames.includes(field.fieldName));

      setAvailableFieldsList(available);
      setSelectedFieldsList(selected);
      setColumnConfigs(selectedColumns);
      setCurrentStep(1);
      setLeftSelectedKeys([]);
      setRightSelectedKeys([]);
    }
  }, [visible, availableFields, selectedColumns]);

  // 全部移到右侧
  const handleMoveAllToRight = () => {
    setSelectedFieldsList([...selectedFieldsList, ...availableFieldsList]);
    setAvailableFieldsList([]);
    setLeftSelectedKeys([]);
  };

  // 选中项移到右侧
  const handleMoveToRight = () => {
    const selected = availableFieldsList.filter((field) => leftSelectedKeys.includes(field.fieldName));
    setSelectedFieldsList([...selectedFieldsList, ...selected]);
    setAvailableFieldsList(availableFieldsList.filter((field) => !leftSelectedKeys.includes(field.fieldName)));
    setLeftSelectedKeys([]);
  };

  // 选中项移到左侧
  const handleMoveToLeft = () => {
    const selected = selectedFieldsList.filter((field) => rightSelectedKeys.includes(field.fieldName));
    setAvailableFieldsList([...availableFieldsList, ...selected]);
    setSelectedFieldsList(selectedFieldsList.filter((field) => !rightSelectedKeys.includes(field.fieldName)));
    setRightSelectedKeys([]);
  };

  // 全部移到左侧
  const handleMoveAllToLeft = () => {
    setAvailableFieldsList([...availableFieldsList, ...selectedFieldsList]);
    setSelectedFieldsList([]);
    setRightSelectedKeys([]);
  };

  // 第一步确认，进入第二步
  const handleStep1Confirm = () => {
    if (selectedFieldsList.length === 0) {
      return; // 无已选字段时，确认按钮应该 disabled
    }
    
    // 初始化列配置
    const configs: TableColumn[] = selectedFieldsList.map((field) => {
      // 如果已有配置，保留；否则创建新配置
      const existing = columnConfigs.find((col) => col.fieldName === field.fieldName);
      return existing || {
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        columnName: field.fieldLabel,
        align: 'left',
        width: 120,
      };
    });
    setColumnConfigs(configs);
    setCurrentStep(2);
  };

  // 更新列配置
  const handleColumnConfigChange = (fieldName: string, field: keyof TableColumn, value: any) => {
    setColumnConfigs((prev) =>
      prev.map((col) => (col.fieldName === fieldName ? { ...col, [field]: value } : col))
    );
  };

  // 最终确认
  const handleFinalConfirm = () => {
    onConfirm(columnConfigs);
  };

  // 取消
  const handleCancel = () => {
    setCurrentStep(1);
    onCancel();
  };

  // 是否可以进入第二步
  const canGoToStep2 = selectedFieldsList.length > 0;

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      style={{ top: '50%', transform: 'translateY(-50%)' }}
      className="table-column-config-modal"
      closeIcon={<CloseOutlined style={{ fontSize: 16, color: '#999999' }} />}
    >
      <div className="table-column-config-content">
        {/* 步骤条区域 */}
        <div className="steps-container">
          <div className={`step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-text">选择表格列</div>
          </div>
          <div className="step-connector" style={{ backgroundColor: currentStep >= 2 ? '#165DFF' : '#E5E6EB' }} />
          <div className={`step-item ${currentStep === 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-text">配置表格列</div>
          </div>
        </div>

        {/* 核心配置区域 */}
        <div className="config-container">
          {currentStep === 1 ? (
            // 第一步：选择表格列
            <>
              {/* 左侧：可选字段 */}
              <div className="field-card">
                <div className="field-card-header">可选</div>
                <div className="field-card-content">
                  {availableFieldsList.map((field) => (
                    <div
                      key={field.fieldName}
                      className={`field-item ${leftSelectedKeys.includes(field.fieldName) ? 'selected' : ''}`}
                      onClick={() => {
                        if (leftSelectedKeys.includes(field.fieldName)) {
                          setLeftSelectedKeys(leftSelectedKeys.filter((key) => key !== field.fieldName));
                        } else {
                          setLeftSelectedKeys([...leftSelectedKeys, field.fieldName]);
                        }
                      }}
                    >
                      {field.fieldLabel}
                    </div>
                  ))}
                  {availableFieldsList.length === 0 && (
                    <div className="empty-hint">暂无可选字段</div>
                  )}
                </div>
              </div>

              {/* 中间：操作按钮 */}
              <div className="action-buttons">
                <Button
                  className="action-btn"
                  onClick={handleMoveAllToRight}
                  disabled={availableFieldsList.length === 0}
                  title="全部移至右侧"
                >
                  {'>>'}
                </Button>
                <Button
                  className="action-btn"
                  onClick={handleMoveToRight}
                  disabled={leftSelectedKeys.length === 0}
                  title="选中项移至右侧"
                >
                  {'>'}
                </Button>
                <Button
                  className="action-btn"
                  onClick={handleMoveToLeft}
                  disabled={rightSelectedKeys.length === 0}
                  title="选中项移至左侧"
                >
                  {'<'}
                </Button>
                <Button
                  className="action-btn"
                  onClick={handleMoveAllToLeft}
                  disabled={selectedFieldsList.length === 0}
                  title="全部移至左侧"
                >
                  {'<<'}
                </Button>
              </div>

              {/* 右侧：已选字段 */}
              <div className="field-card">
                <div className="field-card-header">已选</div>
                <div className="field-card-content">
                  {selectedFieldsList.map((field) => (
                    <div
                      key={field.fieldName}
                      className={`field-item ${rightSelectedKeys.includes(field.fieldName) ? 'selected' : ''}`}
                      onClick={() => {
                        if (rightSelectedKeys.includes(field.fieldName)) {
                          setRightSelectedKeys(rightSelectedKeys.filter((key) => key !== field.fieldName));
                        } else {
                          setRightSelectedKeys([...rightSelectedKeys, field.fieldName]);
                        }
                      }}
                    >
                      {field.fieldLabel}
                    </div>
                  ))}
                  {selectedFieldsList.length === 0 && (
                    <div className="empty-hint">请从左侧选择字段</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // 第二步：配置表格列
            <div className="column-config-container">
              <div className="column-config-list">
                {columnConfigs.map((column) => (
                  <div key={column.fieldName} className="column-config-item">
                    <div className="config-item-row">
                      <span className="config-label">字段：</span>
                      <span className="config-value">{column.fieldLabel}</span>
                    </div>
                    <div className="config-item-row">
                      <span className="config-label">列名：</span>
                      <Input
                        value={column.columnName}
                        onChange={(e) => handleColumnConfigChange(column.fieldName, 'columnName', e.target.value)}
                        placeholder="请输入列名"
                        style={{ width: 200 }}
                      />
                    </div>
                    <div className="config-item-row">
                      <span className="config-label">对齐方式：</span>
                      <Radio.Group
                        value={column.align || 'left'}
                        onChange={(e) => handleColumnConfigChange(column.fieldName, 'align', e.target.value)}
                      >
                        <Radio value="left">左对齐</Radio>
                        <Radio value="center">居中</Radio>
                        <Radio value="right">右对齐</Radio>
                      </Radio.Group>
                    </div>
                    <div className="config-item-row">
                      <span className="config-label">列宽：</span>
                      <InputNumber
                        value={column.width}
                        onChange={(value) => handleColumnConfigChange(column.fieldName, 'width', value || 120)}
                        min={50}
                        max={1000}
                        style={{ width: 120 }}
                      />
                      <span style={{ marginLeft: 8, color: '#999' }}>px</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <div className="footer-actions">
          <Button onClick={handleCancel} className="cancel-btn">
            取消
          </Button>
          <Button
            type="primary"
            onClick={currentStep === 1 ? handleStep1Confirm : handleFinalConfirm}
            disabled={currentStep === 1 && !canGoToStep2}
            className="confirm-btn"
          >
            {currentStep === 1 ? '确认' : '保存'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TableColumnConfigModal;
export type { TableColumn };

