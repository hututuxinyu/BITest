package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Schema审计日志实体类
 * 用于记录所有Schema相关操作，用于安全审计
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "schema_audit_log")
@Data
public class SchemaAuditLog {

    /**
     * 审计日志ID（主键）
     */
    @Id
    @Column(name = "audit_log_id", length = 64)
    private String auditLogId;

    /**
     * 报表ID
     */
    @Column(name = "report_id", length = 64)
    private String reportId;

    /**
     * 操作类型：save-保存，export-导出，validate-验证，verify_signature-验证签名，check_security-安全检查
     */
    @Column(name = "operation_type", nullable = false, length = 50)
    private String operationType;

    /**
     * 操作结果：success-成功，failed-失败
     */
    @Column(name = "operation_result", nullable = false, length = 20)
    private String operationResult;

    /**
     * 操作详情（JSON格式）
     */
    @Column(name = "operation_details", columnDefinition = "JSONB")
    private String operationDetails;

    /**
     * 用户ID
     */
    @Column(name = "user_id", length = 64)
    private String userId;

    /**
     * 用户IP地址
     */
    @Column(name = "user_ip", length = 50)
    private String userIp;

    /**
     * 用户代理
     */
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    /**
     * 错误消息
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * 创建时间
     */
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
}

