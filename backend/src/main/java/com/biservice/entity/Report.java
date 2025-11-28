package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 报表实体类
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
     * 所属工程ID
     */
    @Column(name = "project_id", nullable = false, length = 64)
    private String projectId;

    /**
     * 报表名称
     */
    @Column(name = "report_name", nullable = false, length = 255)
    private String reportName;

    /**
     * 报表描述
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 报表状态（draft/published）
     */
    @Column(name = "status", length = 20)
    private String status;

    /**
     * 模板名称
     */
    @Column(name = "template", length = 255)
    private String template;

    /**
     * 标签（JSON格式存储）
     */
    @Column(name = "tags", columnDefinition = "TEXT")
    private String tags;

    /**
     * 创建时间
     */
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;

    /**
     * 更新时间
     */
    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;

    /**
     * 创建人
     */
    @Column(name = "created_by", length = 64)
    private String createdBy;

    /**
     * 最后编辑人
     */
    @Column(name = "last_edited_by", length = 64)
    private String lastEditedBy;
}

