package com.biservice.util;

import com.biservice.entity.Report;
import com.biservice.repository.ReportRepository;
import com.biservice.service.SchemaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Schema数据注入工具类
 * 用于在开发/测试环境中为报表注入示例Schema数据
 * 
 * @author BI Service Team
 */
@Component
public class SchemaDataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(SchemaDataSeeder.class);
    private static final boolean AUTO_SEED_ENABLED = false; // 设置为true启用自动注入

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private SchemaService schemaService;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 初始化时自动注入Schema数据（如果启用）
     */
    @PostConstruct
    public void init() {
        if (!AUTO_SEED_ENABLED) {
            return;
        }

        try {
            seedSchemaData();
            logger.info("Schema数据自动注入完成");
        } catch (Exception e) {
            logger.error("Schema数据自动注入失败", e);
        }
    }

    /**
     * 为报表注入Schema数据
     * 
     * @param reportId 报表ID
     * @param schemaJson Schema JSON字符串
     */
    public void seedSchemaForReport(String reportId, String schemaJson) {
        Optional<Report> reportOpt = reportRepository.findById(reportId);
        if (!reportOpt.isPresent()) {
            logger.warn("报表不存在: {}", reportId);
            return;
        }

        try {
            // 验证Schema格式
            schemaService.validateSchemaFormat(schemaJson);

            // 计算哈希值
            String hash = schemaService.calculateHash(schemaJson);

            // 更新报表
            Report report = reportOpt.get();
            report.setSchemaFile("schemaPath");


            reportRepository.save(report);
            logger.info("已为报表 {} 注入Schema数据", reportId);
        } catch (Exception e) {
            logger.error("为报表 {} 注入Schema数据失败", reportId, e);
            throw new RuntimeException("注入Schema数据失败: " + e.getMessage(), e);
        }
    }

    /**
     * 从文件读取Schema并注入
     * 
     * @param reportId 报表ID
     * @param schemaFilePath Schema文件路径（classpath相对路径）
     */
    public void seedSchemaFromFile(String reportId, String schemaFilePath) {
        try {
            ClassPathResource resource = new ClassPathResource(schemaFilePath);
            if (!resource.exists()) {
                throw new IOException("Schema文件不存在: " + schemaFilePath);
            }

            String schemaJson = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            seedSchemaForReport(reportId, schemaJson);
        } catch (Exception e) {
            logger.error("从文件读取Schema失败: {}", schemaFilePath, e);
            throw new RuntimeException("读取Schema文件失败: " + e.getMessage(), e);
        }
    }

    /**
     * 为测试报表注入示例Schema数据
     */
    private void seedSchemaData() {
        // 为report-001注入Schema
        String schema001 = createExampleSchema("report-001", "销售额趋势分析", "report");
        seedSchemaForReport("report-001", schema001);

        // 为report-002注入Schema
        String schema002 = createExampleSchema("report-002", "渠道绩效对比", "report");
        seedSchemaForReport("report-002", schema002);

        // 为report-101注入Schema
        String schema101 = createExampleSchema("report-101", "财务健康监控", "dashboard");
        seedSchemaForReport("report-101", schema101);
    }

    /**
     * 创建示例Schema JSON
     */
    private String createExampleSchema(String reportId, String reportName, String reportType) {
        try {
            // 构建Schema对象
            java.util.Map<String, Object> schema = new java.util.HashMap<>();
            schema.put("version", "1.0.0");
            schema.put("reportId", reportId);
            schema.put("reportName", reportName);
            schema.put("reportType", reportType);

            // Metadata
            java.util.Map<String, Object> metadata = new java.util.HashMap<>();
            metadata.put("createTime", "2024-01-15T10:30:00Z");
            metadata.put("updateTime", "2024-01-20T14:20:00Z");
            metadata.put("creator", "user-001");
            metadata.put("description", reportName);
            schema.put("metadata", metadata);

            // Canvas
            java.util.Map<String, Object> canvas = new java.util.HashMap<>();
            canvas.put("width", 1920);
            canvas.put("height", 1080);
            canvas.put("backgroundColor", "#f5f5f5");
            canvas.put("grid", true);
            canvas.put("gridSize", 10);
            schema.put("canvas", canvas);

            // Components
            java.util.List<java.util.Map<String, Object>> components = new java.util.ArrayList<>();
            java.util.Map<String, Object> component = new java.util.HashMap<>();
            component.put("componentId", "comp-001");
            component.put("componentType", "barChart");
            component.put("componentName", reportName + "图表");
            java.util.Map<String, Object> position = new java.util.HashMap<>();
            position.put("x", 100);
            position.put("y", 100);
            component.put("position", position);
            java.util.Map<String, Object> size = new java.util.HashMap<>();
            size.put("width", 600);
            size.put("height", 400);
            component.put("size", size);
            component.put("zIndex", 1);
            component.put("visible", true);
            component.put("locked", false);
            java.util.Map<String, Object> props = new java.util.HashMap<>();
            props.put("title", reportName);
            component.put("props", props);
            components.add(component);
            schema.put("components", components);

            // Datasources
            schema.put("datasources", new java.util.ArrayList<>());

            // Interactions
            schema.put("interactions", new java.util.ArrayList<>());

            // I18n
            java.util.Map<String, Object> i18n = new java.util.HashMap<>();
            java.util.Map<String, Object> zhCN = new java.util.HashMap<>();
            zhCN.put("reportName", reportName);
            i18n.put("zh-CN", zhCN);
            schema.put("i18n", i18n);

            // Style
            java.util.Map<String, Object> style = new java.util.HashMap<>();
            java.util.Map<String, Object> background = new java.util.HashMap<>();
            background.put("type", "color");
            background.put("value", "#f5f5f5");
            style.put("reportBackground", background);
            schema.put("style", style);

            // 转换为JSON字符串
            return objectMapper.writeValueAsString(schema);
        } catch (Exception e) {
            throw new RuntimeException("创建示例Schema失败", e);
        }
    }
}




