package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Schema版本历史实体类
 * 用于存储所有历史版本的Schema，支持版本回滚和版本对比
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "schema_version_history")
@Data
public class SchemaVersionHistory {

    /**
     * 版本历史ID（主键）
     */
    @Id
    @Column(name = "version_history_id", length = 64)
    private String versionHistoryId;

    /**
     * 报表ID（外键）
     */
    @Column(name = "report_id", nullable = false, length = 64)
    private String reportId;

    /**
     * Schema版本号
     */
    @Column(name = "schema_version", nullable = false, length = 50)
    private String schemaVersion;

    /**
     * 网元版本号（如：27.0）
     */
    @Column(name = "network_element_version", nullable = false, length = 20)
    private String networkElementVersion;

    /**
     * Schema主版本号
     */
    @Column(name = "schema_major_version", nullable = false)
    private Integer schemaMajorVersion;

    /**
     * Schema修订版本号
     */
    @Column(name = "schema_revision_version", nullable = false)
    private Integer schemaRevisionVersion;

    /**
     * 版本类型：standard-标准版本，custom-局点定制版本
     */
    @Column(name = "version_type", nullable = false, length = 20)
    private String versionType;

    /**
     * 局点ID（当versionType为custom时使用）
     */
    @Column(name = "site_id", length = 64)
    private String siteId;

    /**
     * 基于的标准版本号（当versionType为custom时使用）
     */
    @Column(name = "base_version", length = 50)
    private String baseVersion;

    /**
     * Schema文件内容（BYTEA类型）
     */
    @Lob
    @Column(name = "schema_file", columnDefinition = "BYTEA")
    private byte[] schemaFile;

    /**
     * Schema文件路径（如果存储在文件系统或对象存储）
     */
    @Column(name = "schema_file_path", length = 512)
    private String schemaFilePath;

    /**
     * Schema文件的哈希值（SHA-256）
     */
    @Column(name = "schema_hash", nullable = false, length = 128)
    private String schemaHash;

    /**
     * Schema文件的数字签名
     */
    @Column(name = "schema_signature", columnDefinition = "TEXT")
    private String schemaSignature;

    /**
     * 变更类型：created-创建，updated-更新，migrated-迁移，rolled_back-回滚
     */
    @Column(name = "change_type", nullable = false, length = 20)
    private String changeType;

    /**
     * 变更描述
     */
    @Column(name = "change_description", columnDefinition = "TEXT")
    private String changeDescription;

    /**
     * 变更日志详情（JSON格式）
     */
    @Column(name = "change_log", columnDefinition = "JSONB")
    private String changeLog;

    /**
     * 创建人
     */
    @Column(name = "created_by", nullable = false, length = 64)
    private String createdBy;

    /**
     * 创建时间
     */
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
}

