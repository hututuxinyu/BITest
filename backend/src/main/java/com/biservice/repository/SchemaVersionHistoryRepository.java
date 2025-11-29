package com.biservice.repository;

import com.biservice.entity.SchemaVersionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Schema版本历史Repository
 * 
 * @author BI Service Team
 */
@Repository
public interface SchemaVersionHistoryRepository extends JpaRepository<SchemaVersionHistory, String> {

    /**
     * 根据报表ID查询所有版本历史，按创建时间倒序
     * 
     * @param reportId 报表ID
     * @return 版本历史列表
     */
    List<SchemaVersionHistory> findByReportIdOrderByCreatedTimeDesc(String reportId);

    /**
     * 根据报表ID和版本号查询版本历史
     * 
     * @param reportId 报表ID
     * @param schemaVersion 版本号
     * @return 版本历史
     */
    Optional<SchemaVersionHistory> findByReportIdAndSchemaVersion(String reportId, String schemaVersion);

    /**
     * 根据报表ID和变更类型查询版本历史
     * 
     * @param reportId 报表ID
     * @param changeType 变更类型
     * @return 版本历史列表
     */
    List<SchemaVersionHistory> findByReportIdAndChangeTypeOrderByCreatedTimeDesc(String reportId, String changeType);

    /**
     * 根据网元版本查询版本历史
     * 
     * @param networkElementVersion 网元版本
     * @return 版本历史列表
     */
    List<SchemaVersionHistory> findByNetworkElementVersionOrderByCreatedTimeDesc(String networkElementVersion);

    /**
     * 根据版本类型查询版本历史
     * 
     * @param versionType 版本类型
     * @return 版本历史列表
     */
    List<SchemaVersionHistory> findByVersionTypeOrderByCreatedTimeDesc(String versionType);
}

