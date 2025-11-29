package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户语言偏好实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "user_language_preference")
@Data
public class UserLanguagePreference {

    /**
     * 用户ID
     */
    @Id
    @Column(name = "user_id", length = 64)
    private String userId;

    /**
     * 语言代码（zh-CN/en-US等）
     */
    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode;

    /**
     * 创建时间
     */
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;
}

