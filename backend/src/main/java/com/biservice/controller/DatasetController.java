package com.biservice.controller;

import com.biservice.dto.ApiResponse;
import com.biservice.entity.Dataset;
import com.biservice.entity.DatasetField;
import com.biservice.service.DatasetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * 数据集控制器
 * 
 * @author BI Service Team
 */
@RestController
@RequestMapping("/datasets")
@Validated
public class DatasetController {

    @Autowired
    private DatasetService datasetService;

    /**
     * 获取所有活跃的数据集列表
     * 
     * @return 数据集列表
     */
    @GetMapping
    public ApiResponse<List<Dataset>> getDatasetList() {
        try {
            List<Dataset> datasets = datasetService.getAllActiveDatasets();
            return ApiResponse.success(datasets);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 根据数据集ID获取数据集详情
     * 
     * @param datasetId 数据集ID
     * @return 数据集详情
     */
    @GetMapping("/{datasetId}")
    public ApiResponse<Dataset> getDatasetById(@PathVariable String datasetId) {
        try {
            Dataset dataset = datasetService.getDatasetById(datasetId);
            return ApiResponse.success(dataset);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 根据数据集ID获取所有字段
     * 
     * @param datasetId 数据集ID
     * @return 字段列表
     */
    @GetMapping("/{datasetId}/fields")
    public ApiResponse<List<DatasetField>> getDatasetFields(@PathVariable String datasetId) {
        try {
            List<DatasetField> fields = datasetService.getDatasetFields(datasetId);
            return ApiResponse.success(fields);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 根据数据集ID和标签获取字段列表
     * 
     * @param datasetId 数据集ID
     * @param tag 标签（dimension/measure）
     * @return 字段列表
     */
    @GetMapping("/{datasetId}/fields/{tag}")
    public ApiResponse<List<DatasetField>> getDatasetFieldsByTag(
            @PathVariable String datasetId,
            @PathVariable String tag) {
        try {
            List<DatasetField> fields = datasetService.getDatasetFieldsByTag(datasetId, tag);
            return ApiResponse.success(fields);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 获取数据集及其字段的完整信息
     * 
     * @param datasetId 数据集ID
     * @return 数据集完整信息
     */
    @GetMapping("/{datasetId}/full")
    public ApiResponse<Map<String, Object>> getDatasetWithFields(@PathVariable String datasetId) {
        try {
            Map<String, Object> result = datasetService.getDatasetWithFields(datasetId);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 执行数据集查询
     * 
     * @param request 查询请求
     * @return 查询结果数据列表
     */
    @PostMapping("/query")
    public ApiResponse<List<Map<String, Object>>> queryDataset(@RequestBody com.biservice.dto.DatasetQueryRequest request) {
        try {
            List<Map<String, Object>> result = datasetService.queryDataset(request);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

