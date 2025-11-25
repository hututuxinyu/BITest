package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 工程实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "project")
@Data
public class Project {

    /**
     * 工程ID
     */
    @Id
    @Column(name = "project_id", length = 64)
    private String projectId;

    /**
     * 工程名称
     */
    @Column(name = "project_name", nullable = false, length = 255)
    private String projectName;

    /**
     * 工程描述
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 工程类型（private/public）
     */
    @Column(name = "project_type", nullable = false, length = 20)
    private String projectType;

    /**
     * 所属用户ID
     */
    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

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

    /**
     * 报表数量
     */
    @Column(name = "report_count")
    private Integer reportCount;

    /**
     * 最后报表更新时间
     */
    @Column(name = "last_report_update_time")
    private LocalDateTime lastReportUpdateTime;

    /**
     * Codehub仓库
     */
    @Column(name = "codehub_repository", length = 255)
    private String codehubRepository;

    /**
     * Codehub分支
     */
    @Column(name = "codehub_branch", length = 255)
    private String codehubBranch;

    /**
     * Codehub路径
     */
    @Column(name = "codehub_path", length = 255)
    private String codehubPath;

    /**
     * 状态（active/deleted）
     */
    @Column(name = "status", length = 20)
    private String status;
}

