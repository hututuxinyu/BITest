package com.biservice.controller;

import com.biservice.dto.ApiResponse;
import com.biservice.service.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 模板控制器
 * 
 * @author BI Service Team
 */
@RestController
@RequestMapping("/templates")
@Validated
public class TemplateController {

    @Autowired
    private TemplateService templateService;

    /**
     * 获取所有模板列表
     * 
     * @return 模板列表
     */
    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getAllTemplates() {
        try {
            List<Map<String, Object>> templates = templateService.getAllTemplates();
            return ApiResponse.success(templates);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 根据分类获取模板列表
     * 
     * @param category 分类（report/dashboard）
     * @return 模板列表
     */
    @GetMapping("/category/{category}")
    public ApiResponse<List<Map<String, Object>>> getTemplatesByCategory(@PathVariable String category) {
        try {
            List<Map<String, Object>> templates = templateService.getTemplatesByCategory(category);
            return ApiResponse.success(templates);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 获取模板详情
     * 
     * @param templateId 模板ID
     * @param includeSchema 是否包含Schema内容（可选参数，默认为false）
     * @return 模板信息
     */
    @GetMapping("/{templateId}")
    public ApiResponse<Map<String, Object>> getTemplateById(
            @PathVariable String templateId,
            @RequestParam(required = false, defaultValue = "false") boolean includeSchema) {
        try {
            Map<String, Object> template = templateService.getTemplateById(templateId, includeSchema);
            return ApiResponse.success(template);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 获取模板的Schema内容
     * 
     * @param templateId 模板ID
     * @return Schema JSON对象
     */
    @GetMapping("/{templateId}/schema")
    public ApiResponse<Map<String, Object>> getTemplateSchema(@PathVariable String templateId) {
        try {
            Map<String, Object> schema = templateService.getTemplateSchema(templateId);
            return ApiResponse.success(schema);
        } catch (Exception e) {
            return ApiResponse.error("获取模板Schema失败: " + e.getMessage());
        }
    }
}

