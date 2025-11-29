package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 资源库实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "resource_library",
    indexes = {
        @Index(name = "idx_resource_library_report_component_field", 
               columnList = "report_id,component_id,field_name"),
        @Index(name = "idx_resource_library_report_id", 
               columnList = "report_id")
    })
@Data
public class ResourceLibrary {

    /**
     * 资源ID（主键，KeyID）
     */
    @Id
    @Column(name = "resource_id", length = 64)
    private String resourceId;

    /**
     * 报表ID
     */
    @Column(name = "report_id", length = 64)
    private String reportId;

    /**
     * 组件ID
     */
    @Column(name = "component_id", length = 64)
    private String componentId;

    /**
     * 字段名称（如title、description）
     */
    @Column(name = "field_name", length = 100)
    private String fieldName;

    /**
     * 中文文本
     */
    @Column(name = "chinese_text", columnDefinition = "TEXT")
    private String chineseText;

    /**
     * 英文文本
     */
    @Column(name = "english_text", columnDefinition = "TEXT")
    private String englishText;

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

    /**
     * 创建人ID
     */
    @Column(name = "creator_id", length = 64)
    private String creatorId;
}

