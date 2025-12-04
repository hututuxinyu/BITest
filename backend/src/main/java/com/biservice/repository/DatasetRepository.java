package com.biservice.repository;

import com.biservice.entity.Dataset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * 数据集Repository接口
 * 
 * @author BI Service Team
 */
@Repository
public interface DatasetRepository extends JpaRepository<Dataset, String> {

    /**
     * 根据状态查找数据集列表
     * 
     * @param status 状态
     * @return 数据集列表
     */
    List<Dataset> findByStatus(String status);

    /**
     * 根据数据源ID查找数据集列表
     * 
     * @param datasourceId 数据源ID
     * @return 数据集列表
     */
    List<Dataset> findByDatasourceId(String datasourceId);

    /**
     * 根据数据集ID查找数据集
     * 
     * @param datasetId 数据集ID
     * @return 数据集Optional
     */
    Optional<Dataset> findByDatasetId(String datasetId);
}

