package com.biservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 工程视图对象
 * 
 * @author BI Service Team
 */
@Data
public class ProjectVO {

    /**
     * 工程ID
     */
    private String projectId;

    /**
     * 工程名称
     */
    private String projectName;

    /**
     * 工程描述
     */
    private String description;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 报表数量
     */
    private Integer reportCount;
}


