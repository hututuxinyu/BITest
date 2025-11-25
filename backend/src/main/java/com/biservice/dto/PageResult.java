package com.biservice.dto;

import lombok.Data;
import java.util.List;

/**
 * 分页结果DTO
 * 
 * @param <T> 数据类型
 * @author BI Service Team
 */
@Data
public class PageResult<T> {

    /**
     * 数据列表
     */
    private List<T> list;

    /**
     * 总记录数
     */
    private Long total;

    /**
     * 当前页码
     */
    private Integer pageNum;

    /**
     * 每页大小
     */
    private Integer pageSize;

    /**
     * 总页数
     */
    private Integer totalPages;
}

