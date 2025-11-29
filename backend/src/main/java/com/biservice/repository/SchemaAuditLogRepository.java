package com.biservice.repository;

import com.biservice.entity.SchemaAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Schema审计日志Repository
 * 
 * @author BI Service Team
 */
@Repository
public interface SchemaAuditLogRepository extends JpaRepository<SchemaAuditLog, String> {

    /**
     * 根据报表ID查询审计日志，按创建时间倒序
     * 
     * @param reportId 报表ID
     * @return 审计日志列表
     */
    List<SchemaAuditLog> findByReportIdOrderByCreatedTimeDesc(String reportId);

    /**
     * 根据操作类型查询审计日志
     * 
     * @param operationType 操作类型
     * @return 审计日志列表
     */
    List<SchemaAuditLog> findByOperationTypeOrderByCreatedTimeDesc(String operationType);

    /**
     * 根据用户ID查询审计日志
     * 
     * @param userId 用户ID
     * @return 审计日志列表
     */
    List<SchemaAuditLog> findByUserIdOrderByCreatedTimeDesc(String userId);

    /**
     * 根据时间范围查询审计日志
     * 
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 审计日志列表
     */
    List<SchemaAuditLog> findByCreatedTimeBetweenOrderByCreatedTimeDesc(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * 根据报表ID和时间范围查询审计日志
     * 
     * @param reportId 报表ID
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @return 审计日志列表
     */
    List<SchemaAuditLog> findByReportIdAndCreatedTimeBetweenOrderByCreatedTimeDesc(
            String reportId, LocalDateTime startTime, LocalDateTime endTime);
}

