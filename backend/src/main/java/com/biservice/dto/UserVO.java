package com.biservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户视图对象
 * 
 * @author BI Service Team
 */
@Data
public class UserVO {

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 状态
     */
    private String status;

    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginTime;
}





