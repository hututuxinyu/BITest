package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 数据集字段实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "dataset_field")
@Data
public class DatasetField {

    /**
     * 字段ID
     */
    @Id
    @Column(name = "field_id", length = 64)
    private String fieldId;

    /**
     * 数据集ID
     */
    @Column(name = "dataset_id", nullable = false, length = 64)
    private String datasetId;

    /**
     * 字段名称
     */
    @Column(name = "field_name", nullable = false, length = 255)
    private String fieldName;

    /**
     * 字段类型（string/number/date/boolean）
     */
    @Column(name = "field_type", nullable = false, length = 20)
    private String fieldType;

    /**
     * 字段显示标签
     */
    @Column(name = "field_label", length = 255)
    private String fieldLabel;

    /**
     * 字段标签：dimension（维度，x轴选项）/ measure（度量，y轴选项）
     */
    @Column(name = "tag", nullable = false, length = 20)
    private String tag;

    /**
     * 字段描述
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 排序顺序
     */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /**
     * 创建时间
     */
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
}

