package com.biservice.controller;

import com.biservice.dto.*;
import com.biservice.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;

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
}

