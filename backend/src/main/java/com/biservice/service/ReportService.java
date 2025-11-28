package com.biservice.service;

import com.biservice.dto.ApiResponse;
import com.biservice.dto.CreateReportRequest;
import com.biservice.dto.ReportVO;
import com.biservice.entity.Project;
import com.biservice.entity.Report;
import com.biservice.repository.ProjectRepository;
import com.biservice.repository.ReportRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
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

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ObjectMapper objectMapper;

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

        if (!"active".equals(project.getStatus())) {
            throw new RuntimeException("工程已删除，无法创建报表");
        }

        // 创建报表
        Report report = new Report();
        report.setReportId(UUID.randomUUID().toString());
        report.setProjectId(projectId);
        report.setReportName(request.getReportName());
        report.setDescription(request.getDescription());
        report.setTemplate(request.getTemplate());
        report.setStatus("draft");
        report.setCreatedTime(LocalDateTime.now());
        report.setUpdateTime(LocalDateTime.now());
        report.setCreatedBy(userId);
        report.setLastEditedBy(userId);

        reportRepository.save(report);

        // 更新工程的报表数量和最后更新时间
        long reportCount = reportRepository.countByProjectId(projectId);
        project.setReportCount((int) reportCount);
        project.setLastReportUpdateTime(LocalDateTime.now());
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

        // 更新工程的报表数量和最后更新时间
        long reportCount = reportRepository.countByProjectId(projectId);
        project.setReportCount((int) reportCount);
        project.setLastReportUpdateTime(LocalDateTime.now());
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
        vo.setDescription(report.getDescription());
        vo.setStatus(report.getStatus());
        vo.setTemplate(report.getTemplate());
        vo.setCreatedTime(report.getCreatedTime());
        vo.setUpdateTime(report.getUpdateTime());
        vo.setCreatedBy(report.getCreatedBy());
        vo.setLastEditedBy(report.getLastEditedBy());

        // 解析tags JSON字符串为List
        if (StringUtils.hasText(report.getTags())) {
            try {
                List<String> tags = objectMapper.readValue(report.getTags(), 
                    new TypeReference<List<String>>() {});
                vo.setTags(tags);
            } catch (Exception e) {
                // 解析失败，设置为空列表
                vo.setTags(java.util.Collections.emptyList());
            }
        }

        return vo;
    }
}

