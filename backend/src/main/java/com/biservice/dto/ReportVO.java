package com.biservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 报表视图对象
 * 按照设计态系统设计说明书简化结构
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
     * 报表名称
     */
    private String reportName;

    /**
     * 报表类型（report/dashboard）
     */
    private String reportType;

    /**
     * 所属工程ID
     */
    private String projectId;

    /**
     * Schema文件路径
     */
    private String schemaFile;

    /**
     * 版本号
     */
    private String version;

    /**
     * 状态（draft/published）
     */
    private String status;

    /**
     * 创建人ID
     */
    private String creatorId;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}

