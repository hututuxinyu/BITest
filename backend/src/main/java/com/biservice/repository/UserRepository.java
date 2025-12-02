package com.biservice.repository;

import com.biservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * 用户Repository接口
 * 
 * @author BI Service Team
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    /**
     * 根据用户名查找用户
     * 
     * @param username 用户名
     * @return 用户Optional
     */
    Optional<User> findByUsername(String username);
}





