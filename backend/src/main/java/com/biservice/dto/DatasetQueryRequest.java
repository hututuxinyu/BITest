package com.biservice.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 数据集查询请求
 * 
 * @author BI Service Team
 */
@Data
public class DatasetQueryRequest {
    /**
     * 数据集ID
     */
    private String datasetId;

    /**
     * 数据源ID
     */
    private String datasourceId;

    /**
     * 查询SQL（可选）
     */
    private String query;

    /**
     * X轴字段（用于图表）
     */
    private String xAxisField;

    /**
     * Y轴字段（用于图表）
     */
    private String yAxisField;

    /**
     * 表格列配置（用于表格）
     */
    private List<TableColumnConfig> tableColumns;

    /**
     * 查询参数
     */
    private Map<String, Object> params;

    /**
     * 表格列配置
     */
    @Data
    public static class TableColumnConfig {
        private String fieldName;
        private String fieldLabel;
        private String columnName;
        private String align;
        private Integer width;
    }
}

