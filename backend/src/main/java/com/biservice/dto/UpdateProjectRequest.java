package com.biservice.dto;

import lombok.Data;

/**
 * 更新工程请求DTO
 * 
 * @author BI Service Team
 */
@Data
public class UpdateProjectRequest {

    /**
     * 工程名称
     */
    private String projectName;

    /**
     * 工程描述
     */
    private String description;

    /**
     * 工程类型
     */
    private String projectType;
}


