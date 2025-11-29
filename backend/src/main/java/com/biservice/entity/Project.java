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
}


