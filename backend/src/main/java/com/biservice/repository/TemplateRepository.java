package com.biservice.repository;

import com.biservice.entity.Template;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * 模板Repository接口
 * 
 * @author BI Service Team
 */
@Repository
public interface TemplateRepository extends JpaRepository<Template, String> {

    /**
     * 根据分类查找所有模板
     * 
     * @param category 分类（report/dashboard）
     * @return 模板列表
     */
    List<Template> findByCategoryOrderByCreateTimeDesc(String category);

    /**
     * 查找所有模板
     * 
     * @return 模板列表
     */
    List<Template> findAllByOrderByCreateTimeDesc();
}

