package com.biservice.service;

import com.biservice.dto.*;
import com.biservice.entity.Project;
import com.biservice.entity.Report;
import com.biservice.repository.ProjectRepository;
import com.biservice.repository.ReportRepository;
import com.biservice.service.ReportService;
import com.biservice.service.SchemaService;
import com.biservice.util.SchemaExportUtil;
import com.biservice.util.SchemaValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 工程服务类
 * 
 * @author BI Service Team
 */
@Service
public class ProjectService {

    private static final Logger logger = LoggerFactory.getLogger(ProjectService.class);

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private SchemaService schemaService;

    @Autowired
    private SchemaExportUtil schemaExportUtil;

    @Autowired
    private ReportService reportService;

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
        int safePageNum = (pageNum == null || pageNum < 1) ? 1 : pageNum;
        int safePageSize = (pageSize == null || pageSize < 1) ? 10 : pageSize;
        Sort sort = buildSort(sortField, sortOrder);
        Pageable pageable = PageRequest.of(safePageNum - 1, safePageSize, sort);

        Page<Project> projectPage;
        if (StringUtils.hasText(keyword)) {
            projectPage = projectRepository
                .findByUserIdAndProjectNameContainingIgnoreCase(
                    userId, keyword.trim(), pageable);
        } else {
            projectPage = projectRepository.findByUserId(userId, pageable);
        }

        PageResult<ProjectVO> result = new PageResult<>();
        result.setList(projectPage.getContent().stream()
            .map(this::convertToVO)
            .collect(Collectors.toList()));
        result.setTotal(projectPage.getTotalElements());
        result.setPageNum(safePageNum);
        result.setPageSize(safePageSize);
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
        
        Optional<Project> existingOpt = projectRepository.findByUserIdAndProjectName(
            userId, request.getProjectName());
        if (existingOpt.isPresent()) {
            throw new RuntimeException("工程名称已存在");
        }
        
        Project project = new Project();
        project.setProjectId(UUID.randomUUID().toString());
        project.setProjectName(request.getProjectName());
        project.setDescription(request.getDescription());
        project.setUserId(userId);
        project.setCreateTime(LocalDateTime.now());
        project.setUpdateTime(LocalDateTime.now());
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

        
        if (StringUtils.hasText(request.getProjectName()) && 
            !request.getProjectName().equals(project.getProjectName())) {
            Optional<Project> existingOpt = projectRepository.findByUserIdAndProjectName(
                userId, request.getProjectName());
            if (existingOpt.isPresent() && 
                !existingOpt.get().getProjectId().equals(projectId)) {
                throw new RuntimeException("工程名称已存在");
            }
            project.setProjectName(request.getProjectName());
        }
        
        if (StringUtils.hasText(request.getDescription())) {
            project.setDescription(request.getDescription());
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

        return convertToVO(project);
    }

    /**
     * 构建排序对象
     * 
     * @param sortField 排序字段
     * @param sortOrder 排序方向
     * @return 排序对象
     */
    private static final Map<String, String> SORT_FIELD_MAPPING = Map.of(
        "createTime", "createTime",
        "projectName", "projectName",
        "updateTime", "updateTime",
        "reportCount", "reportCount"
    );

    private Sort buildSort(String sortField, String sortOrder) {
        String resolvedSortField = resolveSortField(sortField);
        // 如果没有指定排序方向，默认使用降序（DESC）
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortOrder)
            ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, resolvedSortField);
    }

    private String resolveSortField(String sortField) {
        if (StringUtils.hasText(sortField) && SORT_FIELD_MAPPING.containsKey(sortField)) {
            return SORT_FIELD_MAPPING.get(sortField);
        }
        // 默认按更新时间降序排序（最近更新的在前）
        return "updateTime";
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
        vo.setCreateTime(project.getCreateTime());
        vo.setUpdateTime(project.getUpdateTime());
        vo.setReportCount(project.getReportCount());
        return vo;
    }

    /**
     * 批量导出工程下所有报表的Schema
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param userIp 用户IP
     * @return ZIP文件输入流
     */
    public InputStream exportProjectSchemas(String userId, String projectId, String userIp) {
        // 验证工程是否存在且属于当前用户
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new RuntimeException("工程不存在");
        }

        Project project = projectOpt.get();
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问该工程");
        }

        try {
            // 查询工程下的所有报表
            List<Report> reports = reportRepository.findByProjectIdOrderByUpdateTimeDesc(projectId);
            if (reports.isEmpty()) {
                throw new RuntimeException("工程下没有报表");
            }

            // 收集所有Schema文件
            Map<String, String> schemaFiles = new LinkedHashMap<>();
            for (Report report : reports) {
                try {
                    // 读取Schema
                    String schemaJson = schemaService.readSchema(report.getReportId());
                    
                    // 验证Schema格式（确保导出的Schema是有效的）
                    SchemaValidator.SchemaValidationResult validationResult = schemaService.validateSchema(schemaJson);
                    if (!validationResult.isValid()) {
                        String errorMsg = "Schema验证失败: " + validationResult.getErrorMessage();
                        logger.warn("报表ID: {}, {}", report.getReportId(), errorMsg);
                        schemaService.recordAuditLog(report.getReportId(), "export", "failed", userId, userIp, errorMsg);
                        // 跳过验证失败的报表，继续处理其他报表
                        continue;
                    }
                    
                    // 格式化JSON
                    String formattedJson = schemaExportUtil.formatJson(schemaJson);
                    
                    // 生成文件名
                    String fileName = schemaExportUtil.generateSchemaFileName(
                            report.getReportName(),
                            report.getReportId(),
                            report.getVersion()
                    );
                    
                    schemaFiles.put(fileName, formattedJson);
                    
                    // 记录审计日志
                    schemaService.recordAuditLog(report.getReportId(), "export", "success", userId, userIp, null);
                } catch (Exception e) {
                    // 单个报表导出失败，记录日志但继续处理其他报表
                    logger.error("导出报表Schema失败，报表ID: {}", report.getReportId(), e);
                    schemaService.recordAuditLog(report.getReportId(), "export", "failed", userId, userIp, e.getMessage());
                    // 跳过失败的报表，继续处理其他报表
                }
            }

            if (schemaFiles.isEmpty()) {
                throw new RuntimeException("没有可导出的Schema文件");
            }

            // 打包成ZIP
            byte[] zipBytes = schemaExportUtil.createZipFile(schemaFiles);

            return new ByteArrayInputStream(zipBytes);
        } catch (Exception e) {
            throw new RuntimeException("批量导出Schema失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取ZIP文件名
     * 
     * @param projectId 工程ID
     * @return ZIP文件名
     */
    public String getZipFileName(String projectId) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new RuntimeException("工程不存在");
        }

        Project project = projectOpt.get();
        return schemaExportUtil.generateZipFileName(project.getProjectName(), project.getProjectId());
    }
}


