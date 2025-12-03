package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "\"user\"")
@Data
public class User {

    /**
     * 用户ID
     */
    @Id
    @Column(name = "user_id", length = 64)
    private String userId;

    /**
     * 用户名
     */
    @Column(name = "username", nullable = false, unique = true, length = 255)
    private String username;

    /**
     * 邮箱
     */
    @Column(name = "email", length = 255)
    private String email;

    /**
     * 密码哈希
     */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    /**
     * 状态（active/inactive）
     */
    @Column(name = "status", length = 20)
    private String status;

    /**
     * 创建时间
     */
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    /**
     * 最后登录时间
     */
    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;
}






