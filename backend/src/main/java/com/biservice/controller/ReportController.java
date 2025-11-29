package com.biservice.controller;

import com.biservice.dto.ApiResponse;
import com.biservice.dto.CreateReportRequest;
import com.biservice.dto.ReportVO;
import com.biservice.service.ReportService;
import com.biservice.service.SchemaService;
import com.biservice.util.SchemaValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 报表控制器
 * 
 * @author BI Service Team
 */
@RestController
@RequestMapping("/reports")
@Validated
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private SchemaService schemaService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 获取工程下的报表列表
     * 
     * @param projectId 工程ID
     * @return 报表列表
     */
    @GetMapping("/project/{projectId}")
    public ApiResponse<List<ReportVO>> getProjectReports(@PathVariable String projectId) {
        try {
            List<ReportVO> reports = reportService.getProjectReports(projectId);
            return ApiResponse.success(reports);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 创建报表
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param request 创建请求
     * @return 报表信息
     */
    @PostMapping("/project/{projectId}")
    public ApiResponse<ReportVO> createReport(
            @RequestParam String userId,
            @PathVariable String projectId,
            @Valid @RequestBody CreateReportRequest request) {
        try {
            ReportVO report = reportService.createReport(userId, projectId, request);
            return ApiResponse.success("创建报表成功", report);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 获取报表详情
     * 
     * @param projectId 工程ID
     * @param reportId 报表ID
     * @return 报表信息
     */
    @GetMapping("/project/{projectId}/{reportId}")
    public ApiResponse<ReportVO> getReportDetail(
            @PathVariable String projectId,
            @PathVariable String reportId) {
        try {
            ReportVO report = reportService.getReportDetail(projectId, reportId);
            return ApiResponse.success(report);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 删除报表
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param reportId 报表ID
     * @return 操作结果
     */
    @DeleteMapping("/project/{projectId}/{reportId}")
    public ApiResponse<Void> deleteReport(
            @RequestParam String userId,
            @PathVariable String projectId,
            @PathVariable String reportId) {
        try {
            reportService.deleteReport(userId, projectId, reportId);
            return ApiResponse.success("删除报表成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 导出报表Schema
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param reportId 报表ID
     * @param request HTTP请求（用于获取IP地址）
     * @return Schema文件
     */
    @GetMapping("/project/{projectId}/{reportId}/schema/export")
    public ResponseEntity<InputStreamResource> exportReportSchema(
            @RequestParam String userId,
            @PathVariable String projectId,
            @PathVariable String reportId,
            HttpServletRequest request) {
        try {
            // 获取用户IP
            String userIp = getClientIpAddress(request);

            // 导出Schema
            InputStream inputStream = reportService.exportReportSchema(userId, projectId, reportId, userIp);
            String fileName = reportService.getSchemaFileName(reportId);

            // 设置响应头
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=\"" + URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString()) + "\"");
            headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(new InputStreamResource(inputStream));
        } catch (Exception e) {
            throw new RuntimeException("导出Schema失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取客户端IP地址
     * 
     * @param request HTTP请求
     * @return IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 处理多个IP的情况，取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "unknown";
    }

    /**
     * 验证报表Schema
     * 
     * @param projectId 工程ID
     * @param reportId 报表ID
     * @return 验证结果
     */
    @GetMapping("/project/{projectId}/{reportId}/schema/validate")
    public ApiResponse<Map<String, Object>> validateReportSchema(
            @PathVariable String projectId,
            @PathVariable String reportId) {
        try {
            // 读取Schema
            String schemaJson = schemaService.readSchema(reportId);

            // 验证Schema
            SchemaValidator.SchemaValidationResult validationResult = schemaService.validateSchema(schemaJson);

            Map<String, Object> result = new HashMap<>();
            result.put("valid", validationResult.isValid());
            result.put("errors", validationResult.getErrors());
            result.put("errorMessage", validationResult.getErrorMessage());

            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("验证Schema失败: " + e.getMessage());
        }
    }

    /**
     * 发布报表
     * 将报表状态从draft改为published
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param reportId 报表ID
     * @return 报表信息
     */
    @PostMapping("/project/{projectId}/{reportId}/publish")
    public ApiResponse<ReportVO> publishReport(
            @RequestParam String userId,
            @PathVariable String projectId,
            @PathVariable String reportId) {
        try {
            ReportVO report = reportService.publishReport(userId, projectId, reportId);
            return ApiResponse.success("发布报表成功", report);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 获取报表Schema
     * 
     * @param projectId 工程ID
     * @param reportId 报表ID
     * @return Schema JSON字符串
     */
    @GetMapping("/project/{projectId}/{reportId}/schema")
    public ApiResponse<Map<String, Object>> getReportSchema(
            @PathVariable String projectId,
            @PathVariable String reportId) {
        try {
            // 验证报表是否存在
            ReportVO report = reportService.getReportDetail(projectId, reportId);
            
            // 读取Schema
            String schemaJson = schemaService.readSchema(reportId);
            
            // 解析JSON并返回
            Map<String, Object> schema = objectMapper.readValue(schemaJson, Map.class);
            
            return ApiResponse.success(schema);
        } catch (Exception e) {
            return ApiResponse.error("获取Schema失败: " + e.getMessage());
        }
    }
}

