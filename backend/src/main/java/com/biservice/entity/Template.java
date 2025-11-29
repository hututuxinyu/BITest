package com.biservice.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 模板实体类
 * 
 * @author BI Service Team
 */
@Entity
@Table(name = "template")
@Data
public class Template {

    /**
     * 模板ID
     */
    @Id
    @Column(name = "template_id", length = 64)
    private String templateId;

    /**
     * 模板名称
     */
    @Column(name = "template_name", nullable = false, length = 255)
    private String templateName;

    /**
     * 分类（report/dashboard）
     */
    @Column(name = "category", length = 20)
    private String category;

    /**
     * Schema文件路径
     */
    @Column(name = "schema_file", length = 500)
    private String schemaFile;

    /**
     * 预览图路径
     */
    @Column(name = "preview_image", length = 500)
    private String previewImage;

    /**
     * 版本号
     */
    @Column(name = "version", length = 50)
    private String version;

    /**
     * 创建时间
     */
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
}

