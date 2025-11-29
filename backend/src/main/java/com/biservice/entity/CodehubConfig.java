package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Codehub配置实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "codehub_config",
    indexes = {
        @Index(name = "idx_codehub_config_user_repo", 
               columnList = "user_id,repository", unique = true),
        @Index(name = "idx_codehub_config_user_id", 
               columnList = "user_id")
    })
@Data
public class CodehubConfig {

    /**
     * 配置ID
     */
    @Id
    @Column(name = "config_id", length = 64)
    private String configId;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    /**
     * 仓库地址（owner/repo格式）
     */
    @Column(name = "repository", nullable = false, length = 255)
    private String repository;

    /**
     * 个人访问令牌（加密存储）
     */
    @Column(name = "personal_access_token", length = 500)
    private String personalAccessToken;

    /**
     * 默认分支（main/master）
     */
    @Column(name = "default_branch", length = 100)
    private String defaultBranch;

    /**
     * 个人分支前缀
     */
    @Column(name = "personal_branch_prefix", length = 100)
    private String personalBranchPrefix;

    /**
     * Codehub API基础URL（支持Codehub Enterprise）
     */
    @Column(name = "base_url", length = 500)
    private String baseUrl;

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

    /**
     * 更新时间
     */
    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;
}

