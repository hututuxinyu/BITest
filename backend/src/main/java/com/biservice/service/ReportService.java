package com.biservice.service;

import com.biservice.dto.ApiResponse;
import com.biservice.dto.CreateReportRequest;
import com.biservice.dto.ReportVO;
import com.biservice.entity.Project;
import com.biservice.entity.Report;
import com.biservice.repository.ProjectRepository;
import com.biservice.repository.ReportRepository;
import com.biservice.service.SchemaService;
import com.biservice.util.SchemaExportUtil;
import com.biservice.util.SchemaValidator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 报表服务类
 * 
 * @author BI Service Team
 */
@Service
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SchemaService schemaService;

    @Autowired
    private SchemaExportUtil schemaExportUtil;

    /**
     * 获取工程下的报表列表
     * 
     * @param projectId 工程ID
     * @return 报表列表
     */
    public List<ReportVO> getProjectReports(String projectId) {
        // 验证工程是否存在
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new RuntimeException("工程不存在");
        }

        List<Report> reports = reportRepository.findByProjectIdOrderByUpdateTimeDesc(projectId);
        return reports.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    /**
     * 创建报表
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param request 创建请求
     * @return 报表信息
     */
    @Transactional
    public ReportVO createReport(String userId, String projectId, CreateReportRequest request) {
        // 验证工程是否存在且属于当前用户
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new RuntimeException("工程不存在");
        }

        Project project = projectOpt.get();
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问该工程");
        }

        // 创建报表
        Report report = new Report();
        report.setReportId(UUID.randomUUID().toString());
        report.setProjectId(projectId);
        report.setReportName(request.getReportName());
        report.setVersion("1.0.0");
        report.setCreateTime(LocalDateTime.now());
        report.setUpdateTime(LocalDateTime.now());

        reportRepository.save(report);

        // 更新工程的报表数量
        long reportCount = reportRepository.countByProjectId(projectId);
        project.setReportCount((int) reportCount);
        project.setUpdateTime(LocalDateTime.now());
        projectRepository.save(project);

        return convertToVO(report);
    }

    /**
     * 获取报表详情
     * 
     * @param projectId 工程ID
     * @param reportId 报表ID
     * @return 报表信息
     */
    public ReportVO getReportDetail(String projectId, String reportId) {
        Optional<Report> reportOpt = reportRepository.findByProjectIdAndReportId(projectId, reportId);
        if (!reportOpt.isPresent()) {
            throw new RuntimeException("报表不存在");
        }

        return convertToVO(reportOpt.get());
    }

    /**
     * 删除报表
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param reportId 报表ID
     */
    @Transactional
    public void deleteReport(String userId, String projectId, String reportId) {
        // 验证工程是否存在且属于当前用户
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new RuntimeException("工程不存在");
        }

        Project project = projectOpt.get();
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问该工程");
        }

        // 验证报表是否存在
        Optional<Report> reportOpt = reportRepository.findByProjectIdAndReportId(projectId, reportId);
        if (!reportOpt.isPresent()) {
            throw new RuntimeException("报表不存在");
        }

        // 删除报表
        reportRepository.deleteById(reportId);

        // 更新工程的报表数量
        long reportCount = reportRepository.countByProjectId(projectId);
        project.setReportCount((int) reportCount);
        project.setUpdateTime(LocalDateTime.now());
        projectRepository.save(project);
    }

    /**
     * 转换为VO
     * 
     * @param report 报表实体
     * @return 报表VO
     */
    private ReportVO convertToVO(Report report) {
        ReportVO vo = new ReportVO();
        vo.setReportId(report.getReportId());
        vo.setProjectId(report.getProjectId());
        vo.setReportName(report.getReportName());
        vo.setReportType(report.getReportType());
        vo.setSchemaFile(report.getSchemaFile());
        vo.setVersion(report.getVersion());
        vo.setStatus(report.getStatus());
        vo.setCreatorId(report.getCreatorId());
        vo.setCreateTime(report.getCreateTime());
        vo.setUpdateTime(report.getUpdateTime());
        return vo;
    }

    /**
     * 导出报表Schema
     * 
     * @param userId 用户ID
     * @param projectId 工程ID
     * @param reportId 报表ID
     * @param userIp 用户IP
     * @return Schema文件输入流
     */
    public InputStream exportReportSchema(String userId, String projectId, String reportId, String userIp) {
        // 验证工程是否存在且属于当前用户
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            throw new RuntimeException("工程不存在");
        }

        Project project = projectOpt.get();
        if (!project.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问该工程");
        }

        // 验证报表是否存在
        Optional<Report> reportOpt = reportRepository.findByProjectIdAndReportId(projectId, reportId);
        if (!reportOpt.isPresent()) {
            throw new RuntimeException("报表不存在");
        }

        Report report = reportOpt.get();

        try {
            // 读取Schema
            String schemaJson = schemaService.readSchema(reportId);

            // 验证Schema格式（确保导出的Schema是有效的）
            SchemaValidator.SchemaValidationResult validationResult = schemaService.validateSchema(schemaJson);
            if (!validationResult.isValid()) {
                String errorMsg = "Schema验证失败，无法导出: " + validationResult.getErrorMessage();
                logger.warn("报表ID: {}, {}", reportId, errorMsg);
                schemaService.recordAuditLog(reportId, "export", "failed", userId, userIp, errorMsg);
                throw new RuntimeException(errorMsg);
            }

            // 格式化JSON
            String formattedJson = schemaExportUtil.formatJson(schemaJson);

            // 记录审计日志
            schemaService.recordAuditLog(reportId, "export", "success", userId, userIp, null);

            // 返回输入流
            return new ByteArrayInputStream(formattedJson.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (Exception e) {
            // 记录审计日志
            schemaService.recordAuditLog(reportId, "export", "failed", userId, userIp, e.getMessage());
            throw new RuntimeException("导出Schema失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取Schema文件名
     * 
     * @param reportId 报表ID
     * @return 文件名
     */
    public String getSchemaFileName(String reportId) {
        Optional<Report> reportOpt = reportRepository.findById(reportId);
        if (!reportOpt.isPresent()) {
            throw new RuntimeException("报表不存在");
        }

        Report report = reportOpt.get();
        return schemaExportUtil.generateSchemaFileName(
                report.getReportName(),
                report.getReportId(),
                report.getVersion()
        );
    }
}

