package com.biservice.repository;

import com.biservice.entity.Project;
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
     * 根据用户ID查找所有活跃工程
     * 
     * @param userId 用户ID
     * @param status 状态
     * @return 工程列表
     */
    List<Project> findByUserIdAndStatus(String userId, String status);

    /**
     * 根据用户ID和工程名称查找工程
     * 
     * @param userId 用户ID
     * @param projectName 工程名称
     * @param status 状态
     * @return 工程Optional
     */
    Optional<Project> findByUserIdAndProjectNameAndStatus(
        String userId, String projectName, String status);

    /**
     * 根据用户ID和工程名称模糊查询
     * 
     * @param userId 用户ID
     * @param projectName 工程名称（支持模糊查询）
     * @param status 状态
     * @return 工程列表
     */
    @Query("SELECT p FROM Project p WHERE p.userId = :userId " +
           "AND p.projectName LIKE %:projectName% AND p.status = :status")
    List<Project> findByUserIdAndProjectNameLike(
        @Param("userId") String userId,
        @Param("projectName") String projectName,
        @Param("status") String status);
}


