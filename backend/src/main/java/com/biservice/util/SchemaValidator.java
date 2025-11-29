package com.biservice.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.everit.json.schema.Schema;
import org.everit.json.schema.ValidationException;
import org.everit.json.schema.loader.SchemaLoader;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Schema验证器
 * 使用JSON Schema验证报表Schema是否符合report-schema.json规范
 * 
 * @author BI Service Team
 */
@Component
public class SchemaValidator {

    private static final Logger logger = LoggerFactory.getLogger(SchemaValidator.class);
    private static final String SCHEMA_FILE_PATH = "schema/report-schema.json";

    private Schema schema;
    private final ObjectMapper objectMapper;

    public SchemaValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * 初始化，加载JSON Schema定义文件
     */
    @PostConstruct
    public void init() {
        try {
            loadSchema();
            logger.info("Schema验证器初始化成功");
        } catch (Exception e) {
            logger.error("Schema验证器初始化失败", e);
            throw new RuntimeException("Schema验证器初始化失败: " + e.getMessage(), e);
        }
    }

    /**
     * 加载JSON Schema定义文件
     */
    private void loadSchema() throws IOException {
        Resource resource = new ClassPathResource(SCHEMA_FILE_PATH);
        if (!resource.exists()) {
            throw new IOException("Schema文件不存在: " + SCHEMA_FILE_PATH);
        }

        try (InputStream inputStream = resource.getInputStream()) {
            JSONObject rawSchema = new JSONObject(new JSONTokener(inputStream));
            this.schema = SchemaLoader.load(rawSchema);
            logger.info("成功加载Schema定义文件: {}", SCHEMA_FILE_PATH);
        }
    }

    /**
     * 验证Schema是否符合规范
     * 
     * @param schemaJson Schema JSON字符串
     * @return 验证结果
     */
    public SchemaValidationResult validate(String schemaJson) {
        SchemaValidationResult result = new SchemaValidationResult();
        List<String> errors = new ArrayList<>();

        try {
            // 1. 验证JSON格式
            JsonNode jsonNode;
            try {
                jsonNode = objectMapper.readTree(schemaJson);
            } catch (Exception e) {
                result.setValid(false);
                errors.add("JSON格式错误: " + e.getMessage());
                result.setErrors(errors);
                return result;
            }

            // 2. 转换为JSONObject进行验证
            JSONObject jsonObject = new JSONObject(schemaJson);

            // 3. 使用JSON Schema验证
            try {
                schema.validate(jsonObject);
                result.setValid(true);
                logger.debug("Schema验证通过");
            } catch (ValidationException e) {
                result.setValid(false);
                errors.addAll(collectValidationErrors(e));
                result.setErrors(errors);
                logger.warn("Schema验证失败: {}", errors);
            }

        } catch (Exception e) {
            result.setValid(false);
            errors.add("验证过程发生错误: " + e.getMessage());
            result.setErrors(errors);
            logger.error("Schema验证异常", e);
        }

        return result;
    }

    /**
     * 收集验证错误信息
     * 
     * @param exception 验证异常
     * @return 错误信息列表
     */
    private List<String> collectValidationErrors(ValidationException exception) {
        List<String> errors = new ArrayList<>();

        if (exception.getCausingExceptions().isEmpty()) {
            // 叶子节点错误
            String errorMsg = buildErrorMessage(exception);
            errors.add(errorMsg);
        } else {
            // 有子错误，递归收集
            for (ValidationException causingException : exception.getCausingExceptions()) {
                errors.addAll(collectValidationErrors(causingException));
            }
        }

        return errors;
    }

    /**
     * 构建错误消息
     * 
     * @param exception 验证异常
     * @return 错误消息
     */
    private String buildErrorMessage(ValidationException exception) {
        StringBuilder errorMsg = new StringBuilder();

        // 错误位置
        if (exception.getPointerToViolation() != null && !exception.getPointerToViolation().isEmpty()) {
            errorMsg.append("路径: ").append(exception.getPointerToViolation()).append("; ");
        }

        // 错误消息
        if (exception.getMessage() != null && !exception.getMessage().isEmpty()) {
            errorMsg.append("错误: ").append(exception.getMessage());
        } else {
            errorMsg.append("验证失败");
        }

        return errorMsg.toString();
    }

    /**
     * Schema验证结果
     */
    public static class SchemaValidationResult {
        private boolean valid;
        private List<String> errors;

        public SchemaValidationResult() {
            this.errors = new ArrayList<>();
        }

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
        }

        public List<String> getErrors() {
            return errors;
        }

        public void setErrors(List<String> errors) {
            this.errors = errors;
        }

        /**
         * 获取错误消息（合并所有错误）
         * 
         * @return 错误消息
         */
        public String getErrorMessage() {
            if (errors.isEmpty()) {
                return "验证失败";
            }
            return String.join("; ", errors);
        }
    }
}

