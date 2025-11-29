package com.biservice.repository;

import com.biservice.entity.SqlExecutionAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

/**
 * SQL执行审计日志Repository
 * 
 * @author BI Service Team
 */
@Repository
public interface SqlExecutionAuditLogRepository extends JpaRepository<SqlExecutionAuditLog, String> {

    /**
     * 根据报表ID查询SQL执行审计日志，按创建时间倒序
     * 
     * @param reportId 报表ID
     * @return SQL执行审计日志列表
     */
    List<SqlExecutionAuditLog> findByReportIdOrderByCreatedTimeDesc(String reportId);

    /**
     * 根据数据源ID查询SQL执行审计日志
     * 
     * @param datasourceId 数据源ID
     * @return SQL执行审计日志列表
     */
    List<SqlExecutionAuditLog> findByDatasourceIdOrderByCreatedTimeDesc(String datasourceId);

    /**
     * 根据执行结果查询SQL执行审计日志
     * 
     * @param executionResult 执行结果
     * @return SQL执行审计日志列表
     */
    List<SqlExecutionAuditLog> findByExecutionResultOrderByCreatedTimeDesc(String executionResult);

    /**
     * 根据用户ID查询SQL执行审计日志
     * 
     * @param userId 用户ID
     * @return SQL执行审计日志列表
     */
    List<SqlExecutionAuditLog> findByUserIdOrderByCreatedTimeDesc(String userId);

    /**
     * 根据时间范围查询SQL执行审计日志
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return SQL执行审计日志列表
     */
    List<SqlExecutionAuditLog> findByCreatedTimeBetweenOrderByCreatedTimeDesc(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据报表ID和时间范围查询SQL执行审计日志
     * 
     * @param reportId 报表ID
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return SQL执行审计日志列表
     */
    List<SqlExecutionAuditLog> findByReportIdAndCreatedTimeBetweenOrderByCreatedTimeDesc(
            String reportId, LocalDateTime startTime, LocalDateTime endTime);
}

