package com.biservice.service;

import com.biservice.dto.*;
import com.biservice.entity.Project;
import com.biservice.repository.ProjectRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * 工程服务测试类
 * 
 * @author BI Service Team
 */
@RunWith(MockitoJUnitRunner.class)
public class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectService projectService;

    private Project testProject;
    private String userId = "user-001";

    @Before
    public void setUp() {
        testProject = new Project();
        testProject.setProjectId("project-001");
        testProject.setProjectName("测试工程");
        testProject.setDescription("测试描述");
        testProject.setProjectType("private");
        testProject.setUserId(userId);
        testProject.setCreateTime(LocalDateTime.now());
        testProject.setUpdateTime(LocalDateTime.now());
        testProject.setStatus("active");
        testProject.setReportCount(0);
    }

    @Test
    public void testCreateProject_Success() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setProjectName("新工程");
        request.setDescription("新工程描述");
        request.setProjectType("private");

        when(projectRepository.findByUserIdAndProjectNameAndStatus(
            userId, "新工程", "active")).thenReturn(Optional.empty());
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectVO result = projectService.createProject(userId, request);

        assertNotNull(result);
        assertEquals("project-001", result.getProjectId());
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testCreateProject_EmptyName() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setProjectName("");

        projectService.createProject(userId, request);
    }

    @Test(expected = RuntimeException.class)
    public void testCreateProject_DuplicateName() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setProjectName("测试工程");

        when(projectRepository.findByUserIdAndProjectNameAndStatus(
            userId, "测试工程", "active")).thenReturn(Optional.of(testProject));

        projectService.createProject(userId, request);
    }

    @Test
    public void testUpdateProject_Success() {
        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setProjectName("更新后的工程名");
        request.setDescription("更新后的描述");

        when(projectRepository.findById("project-001")).thenReturn(Optional.of(testProject));
        when(projectRepository.findByUserIdAndProjectNameAndStatus(
            userId, "更新后的工程名", "active")).thenReturn(Optional.empty());
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectVO result = projectService.updateProject(userId, "project-001", request);

        assertNotNull(result);
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test(expected = RuntimeException.class)
    public void testUpdateProject_NotFound() {
        UpdateProjectRequest request = new UpdateProjectRequest();

        when(projectRepository.findById("project-001")).thenReturn(Optional.empty());

        projectService.updateProject(userId, "project-001", request);
    }

    @Test(expected = RuntimeException.class)
    public void testUpdateProject_Unauthorized() {
        UpdateProjectRequest request = new UpdateProjectRequest();

        testProject.setUserId("other-user");
        when(projectRepository.findById("project-001")).thenReturn(Optional.of(testProject));

        projectService.updateProject(userId, "project-001", request);
    }

    @Test
    public void testDeleteProject_Success() {
        when(projectRepository.findById("project-001")).thenReturn(Optional.of(testProject));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        projectService.deleteProject(userId, "project-001");

        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    public void testGetProjectList_Success() {
        List<Project> projects = new ArrayList<>();
        projects.add(testProject);
        Page<Project> page = new PageImpl<>(projects, PageRequest.of(0, 10), 1);

        when(projectRepository.findByUserIdAndStatus(eq(userId), eq("active"), any(Pageable.class)))
            .thenReturn(page);

        PageResult<ProjectVO> result = projectService.getProjectList(
            userId, 1, 10, null, null, null);

        assertNotNull(result);
        assertEquals(1, result.getList().size());
        assertEquals(1L, result.getTotal().longValue());
        verify(projectRepository, times(1))
            .findByUserIdAndStatus(eq(userId), eq("active"), any(Pageable.class));
    }

    @Test
    public void testGetProjectList_WithKeyword() {
        List<Project> projects = new ArrayList<>();
        projects.add(testProject);
        Page<Project> page = new PageImpl<>(projects, PageRequest.of(0, 10), 1);

        when(projectRepository.findByUserIdAndStatusAndProjectNameContainingIgnoreCase(
            eq(userId), eq("active"), eq("测试"), any(Pageable.class))).thenReturn(page);

        PageResult<ProjectVO> result = projectService.getProjectList(
            userId, 1, 10, "测试", "projectName", "ASC");

        assertNotNull(result);
        assertEquals(1, result.getList().size());
        verify(projectRepository, times(1))
            .findByUserIdAndStatusAndProjectNameContainingIgnoreCase(
                eq(userId), eq("active"), eq("测试"), any(Pageable.class));
    }
}


