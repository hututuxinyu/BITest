package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 数据集实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "dataset")
@Data
public class Dataset {

    /**
     * 数据集ID
     */
    @Id
    @Column(name = "dataset_id", length = 64)
    private String datasetId;

    /**
     * 数据集名称
     */
    @Column(name = "dataset_name", nullable = false, length = 255)
    private String datasetName;

    /**
     * 数据集描述
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 关联的数据源ID
     */
    @Column(name = "datasource_id", length = 64)
    private String datasourceId;

    /**
     * 数据源类型
     */
    @Column(name = "datasource_type", length = 50)
    private String datasourceType;

    /**
     * 状态（active/inactive）
     */
    @Column(name = "status", length = 20)
    private String status;

    /**
     * 创建人ID
     */
    @Column(name = "creator_id", length = 64)
    private String creatorId;

    /**
     * 创建时间
     */
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;
}

