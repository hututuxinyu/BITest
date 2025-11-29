package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 数据源实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "datasource")
@Data
public class Datasource {

    /**
     * 数据源ID
     */
    @Id
    @Column(name = "datasource_id", length = 64)
    private String datasourceId;

    /**
     * 数据源名称
     */
    @Column(name = "datasource_name", nullable = false, length = 255)
    private String datasourceName;

    /**
     * 数据源类型（mysql/postgresql/api/file）
     */
    @Column(name = "datasource_type", nullable = false, length = 50)
    private String datasourceType;

    /**
     * 连接配置（JSON）
     */
    @Column(name = "connection_config", columnDefinition = "JSONB")
    private String connectionConfig;

    /**
     * 状态（active/inactive）
     */
    @Column(name = "status", length = 20)
    private String status;

    /**
     * 创建时间
     */
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
}

