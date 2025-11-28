package com.biservice.repository;

import com.biservice.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * 报表Repository接口
 * 
 * @author BI Service Team
 */
@Repository
public interface ReportRepository extends JpaRepository<Report, String> {

    /**
     * 根据工程ID查找所有报表
     * 
     * @param projectId 工程ID
     * @return 报表列表
     */
    List<Report> findByProjectIdOrderByUpdateTimeDesc(String projectId);

    /**
     * 根据工程ID和报表ID查找报表
     * 
     * @param projectId 工程ID
     * @param reportId 报表ID
     * @return 报表Optional
     */
    Optional<Report> findByProjectIdAndReportId(String projectId, String reportId);

    /**
     * 统计工程下的报表数量
     * 
     * @param projectId 工程ID
     * @return 报表数量
     */
    long countByProjectId(String projectId);
}

