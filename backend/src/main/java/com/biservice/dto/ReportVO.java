package com.biservice.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 报表视图对象
 * 
 * @author BI Service Team
 */
@Data
public class ReportVO {

    /**
     * 报表ID
     */
    private String reportId;

    /**
     * 所属工程ID
     */
    private String projectId;

    /**
     * 报表名称
     */
    private String reportName;

    /**
     * 报表描述
     */
    private String description;

    /**
     * 报表状态（draft/published）
     */
    private String status;

    /**
     * 模板名称
     */
    private String template;

    /**
     * 标签列表
     */
    private List<String> tags;

    /**
     * 创建时间
     */
    private LocalDateTime createdTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 创建人
     */
    private String createdBy;

    /**
     * 最后编辑人
     */
    private String lastEditedBy;
}

