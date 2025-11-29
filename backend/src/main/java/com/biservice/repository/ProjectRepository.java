package com.biservice.repository;

import com.biservice.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * 工程Repository接口
 * 
 * @author BI Service Team
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {

    /**
     * 根据用户ID查找所有工程
     * 
     * @param userId 用户ID
     * @return 工程列表
     */
    List<Project> findByUserId(String userId);

    /**
     * 根据用户ID查找所有工程（分页）
     *
     * @param userId 用户ID
     * @param pageable 分页参数
     * @return 工程分页
     */
    Page<Project> findByUserId(String userId, Pageable pageable);

    /**
     * 根据用户ID和工程名称查找工程
     * 
     * @param userId 用户ID
     * @param projectName 工程名称
     * @return 工程Optional
     */
    Optional<Project> findByUserIdAndProjectName(String userId, String projectName);

    /**
     * 根据用户ID和工程名称模糊查询
     * 
     * @param userId 用户ID
     * @param projectName 工程名称（支持模糊查询）
     * @return 工程列表
     */
    @Query("SELECT p FROM Project p WHERE p.userId = :userId " +
           "AND p.projectName LIKE %:projectName%")
    List<Project> findByUserIdAndProjectNameLike(
        @Param("userId") String userId,
        @Param("projectName") String projectName);

    /**
     * 根据用户ID和工程名称模糊查询（分页）
     *
     * @param userId 用户ID
     * @param projectName 工程名称
     * @param pageable 分页参数
     * @return 工程分页
     */
    Page<Project> findByUserIdAndProjectNameContainingIgnoreCase(
        String userId, String projectName, Pageable pageable);
}


