package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * SQL执行审计日志实体类
 * 用于记录所有SQL执行操作，用于SQL安全审计
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "sql_execution_audit_log")
@Data
public class SqlExecutionAuditLog {

    /**
     * SQL审计ID（主键）
     */
    @Id
    @Column(name = "sql_audit_id", length = 64)
    private String sqlAuditId;

    /**
     * 报表ID
     */
    @Column(name = "report_id", length = 64)
    private String reportId;

    /**
     * 数据源ID
     */
    @Column(name = "datasource_id", length = 64)
    private String datasourceId;

    /**
     * 执行的SQL语句
     */
    @Column(name = "sql_statement", nullable = false, columnDefinition = "TEXT")
    private String sqlStatement;

    /**
     * SQL参数（JSON格式）
     */
    @Column(name = "sql_parameters", columnDefinition = "JSONB")
    private String sqlParameters;

    /**
     * 执行时间（毫秒）
     */
    @Column(name = "execution_time_ms")
    private Integer executionTimeMs;

    /**
     * 执行结果：success-成功，failed-失败，blocked-被阻止
     */
    @Column(name = "execution_result", nullable = false, length = 20)
    private String executionResult;

    /**
     * 影响行数（如果适用）
     */
    @Column(name = "affected_rows")
    private Integer affectedRows;

    /**
     * 错误消息
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * 安全检查结果（JSON格式）
     */
    @Column(name = "security_check_result", columnDefinition = "JSONB")
    private String securityCheckResult;

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
     * 创建时间
     */
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
}

