package com.biservice.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;

/**
 * 创建报表请求DTO
 * 
 * @author BI Service Team
 */
@Data
public class CreateReportRequest {

    /**
     * 报表名称
     */
    @NotBlank(message = "报表名称不能为空")
    private String reportName;

    /**
     * 报表描述
     */
    private String description;

    /**
     * 模板名称
     */
    private String template;
}

