package com.biservice.controller;

import com.biservice.dto.*;
import com.biservice.service.ProjectService;
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

/**
 * 工程控制器
 * 
 * @author BI Service Team
 */
@RestController
@RequestMapping("/projects")
@Validated
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    /**
     * 获取工程列表
     * 
     * @param userId 用户ID
     * @param pageNum 页码
     * @param pageSize 每页大小
     * @param keyword 搜索关键词
     * @param sortField 排序字段
     * @param sortOrder 排序方向
     * @return 分页结果
     */
    @GetMapping
    public ApiResponse<PageResult<ProjectVO>> getProjectList(
            @RequestParam String userId,
            @RequestParam(required = false, defaultValue = "1") Integer pageNum,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sortField,
            @RequestParam(required = false) String sortOrder) {
        try {
            PageResult<ProjectVO> result = projectService.getProjectList(
                userId, pageNum, pageSize, keyword, sortField, sortOrder);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 创建工程
     * 
     * @param userId 用户ID
     * @param request 创建请求
     * @return 工程信息
     */
    @PostMapping
    public ApiResponse<ProjectVO> createProject(
            @RequestParam String userId,
            @Valid @RequestBody CreateProjectRequest request) {
        try {
            ProjectVO project = projectService.createProject(userId, request);
            return ApiResponse.success("创建成功", project);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 更新工程
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param request 更新请求
     * @return 工程信息
     */
    @PutMapping("/{projectId}")
    public ApiResponse<ProjectVO> updateProject(
            @RequestParam String userId,
            @PathVariable String projectId,
            @Valid @RequestBody UpdateProjectRequest request) {
        try {
            ProjectVO project = projectService.updateProject(userId, projectId, request);
            return ApiResponse.success("更新成功", project);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 删除工程
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @return 操作结果
     */
    @DeleteMapping("/{projectId}")
    public ApiResponse<Void> deleteProject(
            @RequestParam String userId,
            @PathVariable String projectId) {
        try {
            projectService.deleteProject(userId, projectId);
            return ApiResponse.success("删除成功", null);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 进入工程
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @return 工程信息
     */
    @PostMapping("/{projectId}/enter")
    public ApiResponse<ProjectVO> enterProject(
            @RequestParam String userId,
            @PathVariable String projectId) {
        try {
            ProjectVO project = projectService.enterProject(userId, projectId);
            return ApiResponse.success(project);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    /**
     * 批量导出工程下所有报表的Schema
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param request HTTP请求（用于获取IP地址）
     * @return ZIP文件
     */
    @GetMapping("/{projectId}/schemas/export")
    public ResponseEntity<InputStreamResource> exportProjectSchemas(
            @RequestParam String userId,
            @PathVariable String projectId,
            HttpServletRequest request) {
        try {
            // 获取用户IP
            String userIp = getClientIpAddress(request);

            // 批量导出Schema
            InputStream inputStream = projectService.exportProjectSchemas(userId, projectId, userIp);
            String fileName = projectService.getZipFileName(projectId);

            // 设置响应头
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=\"" + URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString()) + "\"");
            headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(new InputStreamResource(inputStream));
        } catch (Exception e) {
            throw new RuntimeException("批量导出Schema失败: " + e.getMessage(), e);
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
}


