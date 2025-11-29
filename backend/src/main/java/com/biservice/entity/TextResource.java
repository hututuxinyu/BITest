package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 文本资源实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "text_resource")
@Data
public class TextResource {

    /**
     * 资源ID
     */
    @Id
    @Column(name = "resource_id", length = 64)
    private String resourceId;

    /**
     * 资源键（如common.save）
     */
    @Column(name = "resource_key", nullable = false, length = 255)
    private String resourceKey;

    /**
     * 语言代码
     */
    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode;

    /**
     * 资源值（翻译文本）
     */
    @Column(name = "resource_value", columnDefinition = "TEXT")
    private String resourceValue;

    /**
     * 所属模块（common/design/runtime）
     */
    @Column(name = "module", length = 50)
    private String module;

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

