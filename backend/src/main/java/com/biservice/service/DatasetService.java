package com.biservice.service;

import com.biservice.entity.Dataset;
import com.biservice.entity.DatasetField;
import com.biservice.repository.DatasetRepository;
import com.biservice.repository.DatasetFieldRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 数据集服务类
 * 
 * @author BI Service Team
 */
@Service
public class DatasetService {

    private static final Logger logger = LoggerFactory.getLogger(DatasetService.class);

    @Autowired
    private DatasetRepository datasetRepository;

    @Autowired
    private DatasetFieldRepository datasetFieldRepository;

    /**
     * 获取所有活跃的数据集列表
     * 
     * @return 数据集列表
     */
    public List<Dataset> getAllActiveDatasets() {
        try {
            return datasetRepository.findByStatus("active");
        } catch (Exception e) {
            logger.error("获取数据集列表失败", e);
            throw new RuntimeException("获取数据集列表失败: " + e.getMessage());
        }
    }

    /**
     * 根据数据集ID获取数据集详情
     * 
     * @param datasetId 数据集ID
     * @return 数据集
     */
    public Dataset getDatasetById(String datasetId) {
        try {
            return datasetRepository.findByDatasetId(datasetId)
                    .orElseThrow(() -> new RuntimeException("数据集不存在: " + datasetId));
        } catch (Exception e) {
            logger.error("获取数据集详情失败: {}", datasetId, e);
            throw new RuntimeException("获取数据集详情失败: " + e.getMessage());
        }
    }

    /**
     * 根据数据集ID获取所有字段
     * 
     * @param datasetId 数据集ID
     * @return 字段列表
     */
    public List<DatasetField> getDatasetFields(String datasetId) {
        try {
            return datasetFieldRepository.findByDatasetIdOrderBySortOrder(datasetId);
        } catch (Exception e) {
            logger.error("获取数据集字段失败: {}", datasetId, e);
            throw new RuntimeException("获取数据集字段失败: " + e.getMessage());
        }
    }

    /**
     * 根据数据集ID和标签获取字段列表
     * 
     * @param datasetId 数据集ID
     * @param tag 标签（dimension/measure）
     * @return 字段列表
     */
    public List<DatasetField> getDatasetFieldsByTag(String datasetId, String tag) {
        try {
            return datasetFieldRepository.findByDatasetIdAndTag(datasetId, tag);
        } catch (Exception e) {
            logger.error("获取数据集字段失败: datasetId={}, tag={}", datasetId, tag, e);
            throw new RuntimeException("获取数据集字段失败: " + e.getMessage());
        }
    }

    /**
     * 获取数据集及其字段的完整信息
     * 
     * @param datasetId 数据集ID
     * @return 数据集信息（包含字段列表）
     */
    public Map<String, Object> getDatasetWithFields(String datasetId) {
        try {
            Dataset dataset = getDatasetById(datasetId);
            List<DatasetField> fields = getDatasetFields(datasetId);
            
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("dataset", dataset);
            result.put("fields", fields);
            result.put("dimensionFields", fields.stream()
                .filter(f -> "dimension".equals(f.getTag()))
                .collect(Collectors.toList()));
            result.put("measureFields", fields.stream()
                .filter(f -> "measure".equals(f.getTag()))
                .collect(Collectors.toList()));
            
            return result;
        } catch (Exception e) {
            logger.error("获取数据集完整信息失败: {}", datasetId, e);
            throw new RuntimeException("获取数据集完整信息失败: " + e.getMessage());
        }
    }

    /**
     * 执行数据集查询
     * 
     * @param request 查询请求
     * @return 查询结果数据列表
     */
    public List<Map<String, Object>> queryDataset(com.biservice.dto.DatasetQueryRequest request) {
        try {
            Dataset dataset = getDatasetById(request.getDatasetId());
            List<DatasetField> fields = getDatasetFields(request.getDatasetId());

            // 生成模拟数据（实际应该执行SQL查询）
            // 这里为了预览功能，生成基于字段配置的模拟数据
            List<Map<String, Object>> result = new java.util.ArrayList<>();

            // 如果是图表查询（有xAxisField和yAxisField）
            if (request.getXAxisField() != null && request.getYAxisField() != null) {
                // 生成图表数据格式
                // 根据xAxisField和yAxisField生成数据
                DatasetField xAxisField = fields.stream()
                    .filter(f -> f.getFieldName().equals(request.getXAxisField()))
                    .findFirst()
                    .orElse(null);
                DatasetField yAxisField = fields.stream()
                    .filter(f -> f.getFieldName().equals(request.getYAxisField()))
                    .findFirst()
                    .orElse(null);

                for (int i = 0; i < 10; i++) {
                    Map<String, Object> row = new java.util.HashMap<>();
                    // X轴字段值
                    if (xAxisField != null) {
                        if ("number".equals(xAxisField.getFieldType()) || "integer".equals(xAxisField.getFieldType())) {
                            row.put("category", i + 1);
                        } else if ("date".equals(xAxisField.getFieldType()) || "datetime".equals(xAxisField.getFieldType())) {
                            row.put("category", java.time.LocalDate.now().minusDays(10 - i).toString());
                        } else {
                            row.put("category", xAxisField.getFieldLabel() + (i + 1));
                        }
                    } else {
                        row.put("category", "分类" + (i + 1));
                    }
                    // Y轴字段值
                    if (yAxisField != null) {
                        if ("number".equals(yAxisField.getFieldType()) || "integer".equals(yAxisField.getFieldType())) {
                            row.put("value", (int)(Math.random() * 1000));
                        } else {
                            row.put("value", Math.random() * 100);
                        }
                    } else {
                        row.put("value", Math.random() * 100);
                    }
                    row.put("series", "系列1");
                    result.add(row);
                }
            } else if (request.getTableColumns() != null && !request.getTableColumns().isEmpty()) {
                // 如果是表格查询（有tableColumns）
                // 生成表格数据格式
                for (int i = 0; i < 10; i++) {
                    Map<String, Object> row = new java.util.HashMap<>();
                    for (com.biservice.dto.DatasetQueryRequest.TableColumnConfig col : request.getTableColumns()) {
                        String fieldName = col.getFieldName();
                        // 根据字段类型生成不同的数据
                        DatasetField field = fields.stream()
                            .filter(f -> f.getFieldName().equals(fieldName))
                            .findFirst()
                            .orElse(null);
                        
                        if (field != null) {
                            if ("number".equals(field.getFieldType()) || "integer".equals(field.getFieldType())) {
                                row.put(fieldName, (int)(Math.random() * 1000));
                            } else if ("date".equals(field.getFieldType()) || "datetime".equals(field.getFieldType())) {
                                row.put(fieldName, java.time.LocalDate.now().minusDays(10 - i).toString());
                            } else {
                                row.put(fieldName, "数据" + (i + 1));
                            }
                        } else {
                            row.put(fieldName, "值" + (i + 1));
                        }
                    }
                    result.add(row);
                }
            } else {
                // 默认生成所有字段的数据
                for (int i = 0; i < 10; i++) {
                    Map<String, Object> row = new java.util.HashMap<>();
                    for (DatasetField field : fields) {
                        String fieldName = field.getFieldName();
                        if ("number".equals(field.getFieldType()) || "integer".equals(field.getFieldType())) {
                            row.put(fieldName, (int)(Math.random() * 1000));
                        } else if ("date".equals(field.getFieldType()) || "datetime".equals(field.getFieldType())) {
                            row.put(fieldName, java.time.LocalDate.now().minusDays(10 - i).toString());
                        } else {
                            row.put(fieldName, field.getFieldLabel() + (i + 1));
                        }
                    }
                    result.add(row);
                }
            }

            return result;
        } catch (Exception e) {
            logger.error("数据集查询失败: datasetId={}", request.getDatasetId(), e);
            throw new RuntimeException("数据集查询失败: " + e.getMessage());
        }
    }
}

