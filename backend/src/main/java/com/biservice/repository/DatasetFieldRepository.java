package com.biservice.repository;

import com.biservice.entity.DatasetField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * 数据集字段Repository接口
 * 
 * @author BI Service Team
 */
@Repository
public interface DatasetFieldRepository extends JpaRepository<DatasetField, String> {

    /**
     * 根据数据集ID查找所有字段
     * 
     * @param datasetId 数据集ID
     * @return 字段列表
     */
    List<DatasetField> findByDatasetId(String datasetId);

    /**
     * 根据数据集ID和标签查找字段列表
     * 
     * @param datasetId 数据集ID
     * @param tag 标签（dimension/measure）
     * @return 字段列表
     */
    List<DatasetField> findByDatasetIdAndTag(String datasetId, String tag);

    /**
     * 根据数据集ID查找字段列表，按排序顺序排序
     * 
     * @param datasetId 数据集ID
     * @return 字段列表
     */
    List<DatasetField> findByDatasetIdOrderBySortOrder(String datasetId);
}

