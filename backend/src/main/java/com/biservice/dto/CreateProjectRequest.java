package com.biservice.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;

/**
 * 创建工程请求DTO
 * 
 * @author BI Service Team
 */
@Data
public class CreateProjectRequest {

    /**
     * 工程名称
     */
    @NotBlank(message = "工程名称不能为空")
    private String projectName;

    /**
     * 工程描述
     */
    private String description;
}


