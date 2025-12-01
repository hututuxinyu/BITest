package com.biservice.service;

import com.biservice.entity.Template;
import com.biservice.repository.TemplateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 模板服务类
 * 实现模板的查询和Schema读取功能
 * 
 * @author BI Service Team
 */
@Service
public class TemplateService {

    private static final Logger logger = LoggerFactory.getLogger(TemplateService.class);

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Schema文件存储根目录
     */
    @Value("${schema.storage.path:./schema-storage}")
    private String schemaStoragePath;

    /**
     * 获取所有模板列表
     * 
     * @return 模板列表
     */
    public List<Map<String, Object>> getAllTemplates() {
        List<Template> templates = templateRepository.findAllByOrderByCreateTimeDesc();
        return templates.stream()
                .map(this::convertToMap)
                .collect(Collectors.toList());
    }

    /**
     * 根据分类获取模板列表
     * 
     * @param category 分类（report/dashboard）
     * @return 模板列表
     */
    public List<Map<String, Object>> getTemplatesByCategory(String category) {
        List<Template> templates = templateRepository.findByCategoryOrderByCreateTimeDesc(category);
        return templates.stream()
                .map(this::convertToMap)
                .collect(Collectors.toList());
    }

    /**
     * 根据模板ID获取模板详情
     * 
     * @param templateId 模板ID
     * @param includeSchema 是否包含Schema内容
     * @return 模板信息
     */
    public Map<String, Object> getTemplateById(String templateId, boolean includeSchema) {
        Optional<Template> templateOpt = templateRepository.findById(templateId);
        if (!templateOpt.isPresent()) {
            throw new RuntimeException("模板不存在");
        }
        
        Template template = templateOpt.get();
        Map<String, Object> result = convertToMap(template);
        
        // 如果需要包含Schema，读取并添加到结果中
        if (includeSchema && StringUtils.hasText(template.getSchemaFile())) {
            try {
                String schemaJson = readSchemaFromFile(template.getSchemaFile());
                Map<String, Object> schema = objectMapper.readValue(schemaJson, Map.class);
                result.put("schema", schema);
            } catch (Exception e) {
                logger.warn("读取模板Schema失败，模板ID: {}, 错误: {}", templateId, e.getMessage());
                // Schema读取失败不影响返回基本信息，只记录警告
            }
        }
        
        return result;
    }
    
    /**
     * 根据模板ID获取模板详情（不包含Schema）
     * 
     * @param templateId 模板ID
     * @return 模板信息
     */
    public Map<String, Object> getTemplateById(String templateId) {
        return getTemplateById(templateId, false);
    }

    /**
     * 获取模板的Schema内容
     * 
     * @param templateId 模板ID
     * @return Schema JSON对象
     */
    public Map<String, Object> getTemplateSchema(String templateId) {
        Optional<Template> templateOpt = templateRepository.findById(templateId);
        if (!templateOpt.isPresent()) {
            throw new RuntimeException("模板不存在");
        }

        Template template = templateOpt.get();
        if (!StringUtils.hasText(template.getSchemaFile())) {
            throw new RuntimeException("模板Schema文件路径为空");
        }

        try {
            String schemaJson = readSchemaFromFile(template.getSchemaFile());
            Map<String, Object> schema = objectMapper.readValue(schemaJson, Map.class);
            return schema;
        } catch (Exception e) {
            logger.error("读取模板Schema失败，模板ID: {}", templateId, e);
            throw new RuntimeException("读取模板Schema失败: " + e.getMessage(), e);
        }
    }

    /**
     * 从文件系统读取Schema文件
     * 
     * @param filePath Schema文件路径
     * @return Schema JSON字符串
     */
    private String readSchemaFromFile(String filePath) throws IOException {
        if (!StringUtils.hasText(filePath)) {
            throw new RuntimeException("Schema文件路径为空");
        }
        
        Path path;
        
        // 判断路径类型并解析
        if (filePath.contains(":") || (filePath.startsWith("/") && !filePath.startsWith("./"))) {
            // 绝对路径
            path = Paths.get(filePath);
        } else if (filePath.startsWith("./")) {
            // 相对路径（以./开头）
            String relativePath = filePath.substring(2);
            if (relativePath.startsWith("schema-storage/")) {
                path = Paths.get(relativePath);
            } else {
                path = Paths.get(schemaStoragePath, relativePath);
            }
        } else {
            // 相对路径（不以./开头），相对于schemaStoragePath
            path = Paths.get(schemaStoragePath, filePath);
        }
        
        // 如果文件不存在，尝试直接相对于当前工作目录查找
        if (!Files.exists(path)) {
            String directPath = filePath.startsWith("./") ? filePath.substring(2) : filePath;
            Path directPathObj = Paths.get(directPath);
            if (Files.exists(directPathObj)) {
                path = directPathObj;
                logger.info("找到Schema文件（相对于工作目录）: {}", directPathObj.toAbsolutePath());
            } else {
                throw new RuntimeException("Schema文件不存在: " + filePath + " (尝试路径: " + path.toAbsolutePath() + ")");
            }
        }
        
        return new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
    }

    /**
     * 将Template实体转换为Map
     * 
     * @param template 模板实体
     * @return Map对象
     */
    private Map<String, Object> convertToMap(Template template) {
        Map<String, Object> map = new HashMap<>();
        map.put("templateId", template.getTemplateId());
        map.put("templateName", template.getTemplateName());
        map.put("category", template.getCategory());
        map.put("schemaFile", template.getSchemaFile());
        map.put("previewImage", template.getPreviewImage());
        map.put("version", template.getVersion());
        map.put("createTime", template.getCreateTime());
        return map;
    }
}

