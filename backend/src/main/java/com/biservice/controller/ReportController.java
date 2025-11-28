package com.biservice.controller;

import com.biservice.dto.ApiResponse;
import com.biservice.dto.CreateReportRequest;
import com.biservice.dto.ReportVO;
import com.biservice.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;
import java.util.List;

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
}

