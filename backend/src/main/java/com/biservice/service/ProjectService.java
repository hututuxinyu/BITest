package com.biservice.service;

import com.biservice.dto.*;
import com.biservice.entity.Project;
import com.biservice.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 工程服务类
 * 
 * @author BI Service Team
 */
@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    /**
     * 获取用户的工程列表
     * 
     * @param userId 用户ID
     * @param pageNum 页码
     * @param pageSize 每页大小
     * @param keyword 搜索关键词
     * @param sortField 排序字段
     * @param sortOrder 排序方向
     * @return 分页结果
     */
    public PageResult<ProjectVO> getProjectList(String userId, Integer pageNum, 
            Integer pageSize, String keyword, String sortField, String sortOrder) {
        if (pageNum == null || pageNum < 1) {
            pageNum = 1;
        }
        if (pageSize == null || pageSize < 1) {
            pageSize = 10;
        }
        
        Sort sort = buildSort(sortField, sortOrder);
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, sort);
        
        Page<Project> projectPage;
        if (StringUtils.hasText(keyword)) {
            List<Project> projects = projectRepository.findByUserIdAndProjectNameLike(
                userId, keyword, "active");
            long total = projects.size();
            int start = (pageNum - 1) * pageSize;
            int end = Math.min(start + pageSize, projects.size());
            List<Project> pageProjects = projects.subList(start, end);
            projectPage = new org.springframework.data.domain.PageImpl<>(
                pageProjects, pageable, total);
        } else {
            List<Project> projects = projectRepository.findByUserIdAndStatus(userId, "active");
            long total = projects.size();
            int start = (pageNum - 1) * pageSize;
            int end = Math.min(start + pageSize, projects.size());
            List<Project> pageProjects = projects.subList(start, end);
            projectPage = new org.springframework.data.domain.PageImpl<>(
                pageProjects, pageable, total);
        }
        
        PageResult<ProjectVO> result = new PageResult<>();
        result.setList(projectPage.getContent().stream()
            .map(this::convertToVO)
            .collect(Collectors.toList()));
        result.setTotal(projectPage.getTotalElements());
        result.setPageNum(pageNum);
        result.setPageSize(pageSize);
        result.setTotalPages(projectPage.getTotalPages());
        
        return result;
    }

    /**
     * 创建工程
     * 
     * @param userId 用户ID
     * @param request 创建请求
     * @return 工程信息
     */
    @Transactional
    public ProjectVO createProject(String userId, CreateProjectRequest request) {
        if (!StringUtils.hasText(request.getProjectName())) {
            throw new IllegalArgumentException("工程名称不能为空");
        }
        
        Optional<Project> existingOpt = projectRepository.findByUserIdAndProjectNameAndStatus(
            userId, request.getProjectName(), "active");
        if (existingOpt.isPresent()) {
            throw new RuntimeException("工程名称已存在");
        }
        
        Project project = new Project();
        project.setProjectId(UUID.randomUUID().toString());
        project.setProjectName(request.getProjectName());
        project.setDescription(request.getDescription());
        project.setProjectType(StringUtils.hasText(request.getProjectType()) ? 
            request.getProjectType() : "private");
        project.setUserId(userId);
        project.setCreateTime(LocalDateTime.now());
        project.setUpdateTime(LocalDateTime.now());
        project.setStatus("active");
        project.setReportCount(0);
        
        projectRepository.save(project);
        
        return convertToVO(project);
    }

    /**
     * 更新工程
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param request 更新请求
     * @return 工程信息
     */
    @Transactional
    public ProjectVO updateProject(String userId, String projectId, 
            UpdateProjectRequest request) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new RuntimeException("工程不存在");
        }
        
        Project project = projectOpt.get();
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问该工程");
        }
        
        if (!"active".equals(project.getStatus())) {
            throw new RuntimeException("工程已删除，无法更新");
        }
        
        if (StringUtils.hasText(request.getProjectName()) && 
            !request.getProjectName().equals(project.getProjectName())) {
            Optional<Project> existingOpt = projectRepository.findByUserIdAndProjectNameAndStatus(
                userId, request.getProjectName(), "active");
            if (existingOpt.isPresent() && 
                !existingOpt.get().getProjectId().equals(projectId)) {
                throw new RuntimeException("工程名称已存在");
            }
            project.setProjectName(request.getProjectName());
        }
        
        if (StringUtils.hasText(request.getDescription())) {
            project.setDescription(request.getDescription());
        }
        if (StringUtils.hasText(request.getProjectType())) {
            project.setProjectType(request.getProjectType());
        }
        project.setUpdateTime(LocalDateTime.now());
        
        projectRepository.save(project);
        
        return convertToVO(project);
    }

    /**
     * 删除工程
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     */
    @Transactional
    public void deleteProject(String userId, String projectId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new RuntimeException("工程不存在");
        }
        
        Project project = projectOpt.get();
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("无权删除该工程");
        }
        
        project.setStatus("deleted");
        project.setUpdateTime(LocalDateTime.now());
        projectRepository.save(project);
    }

    /**
     * 进入工程
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @return 工程信息
     */
    public ProjectVO enterProject(String userId, String projectId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new RuntimeException("工程不存在");
        }
        
        Project project = projectOpt.get();
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问该工程");
        }
        
        if (!"active".equals(project.getStatus())) {
            throw new RuntimeException("工程已删除，无法访问");
        }
        
        return convertToVO(project);
    }

    /**
     * 构建排序对象
     * 
     * @param sortField 排序字段
     * @param sortOrder 排序方向
     * @return 排序对象
     */
    private Sort buildSort(String sortField, String sortOrder) {
        if (!StringUtils.hasText(sortField)) {
            sortField = "createTime";
        }
        if (!StringUtils.hasText(sortOrder)) {
            sortOrder = "DESC";
        }
        
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortOrder) ? 
            Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, sortField);
    }

    /**
     * 转换为VO
     * 
     * @param project 工程实体
     * @return 工程VO
     */
    private ProjectVO convertToVO(Project project) {
        ProjectVO vo = new ProjectVO();
        vo.setProjectId(project.getProjectId());
        vo.setProjectName(project.getProjectName());
        vo.setDescription(project.getDescription());
        vo.setProjectType(project.getProjectType());
        vo.setCreateTime(project.getCreateTime());
        vo.setUpdateTime(project.getUpdateTime());
        vo.setReportCount(project.getReportCount());
        vo.setLastReportUpdateTime(project.getLastReportUpdateTime());
        return vo;
    }
}


