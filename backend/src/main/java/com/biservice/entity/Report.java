package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 报表实体类
 * 按照设计态系统设计说明书简化结构
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "report")
@Data
public class Report {

    /**
     * 报表ID
     */
    @Id
    @Column(name = "report_id", length = 64)
    private String reportId;

    /**
     * 报表名称
     */
    @Column(name = "report_name", nullable = false, length = 255)
    private String reportName;

    /**
     * 报表类型（report/dashboard）
     */
    @Column(name = "report_type", length = 20)
    private String reportType;

    /**
     * 所属工程ID
     */
    @Column(name = "project_id", nullable = false, length = 64)
    private String projectId;

    /**
     * Schema文件路径
     */
    @Column(name = "schema_file", length = 500)
    private String schemaFile;

    /**
     * 版本号
     */
    @Column(name = "version", length = 50)
    private String version;

    /**
     * 状态（draft/published）
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

