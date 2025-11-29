package com.biservice.util;

import com.biservice.entity.Report;
import com.biservice.repository.ReportRepository;
import com.biservice.service.SchemaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Schema测试数据生成器
 * 用于生成测试用的Schema文件，方便测试报表发布功能
 * 
 * 使用方法：
 * 1. 确保数据库中有测试报表数据（report表）
 * 2. 运行应用，此组件会自动生成Schema文件
 * 3. 或者手动调用 generateTestSchemas() 方法
 * 
 * @author BI Service Team
 */
@Component
@Order(100) // 在数据初始化之后执行
public class SchemaTestDataGenerator implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(SchemaTestDataGenerator.class);

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private SchemaService schemaService;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${schema.storage.path:./schema-storage}")
    private String schemaStoragePath;

    /**
     * 应用启动时自动生成测试Schema文件
     */
    @Override
    public void run(String... args) {
        // 可以通过环境变量控制是否自动生成
        String autoGenerate = System.getProperty("schema.test.auto-generate", "false");
        if (!"true".equalsIgnoreCase(autoGenerate)) {
            logger.info("跳过Schema测试数据自动生成（设置 -Dschema.test.auto-generate=true 启用）");
            return;
        }

        try {
            generateTestSchemas();
            logger.info("Schema测试数据生成完成");
        } catch (Exception e) {
            logger.error("Schema测试数据生成失败", e);
        }
    }

    /**
     * 生成所有测试报表的Schema文件
     */
    public void generateTestSchemas() {
        logger.info("开始生成Schema测试数据...");

        // 确保存储目录存在
        try {
            Path storagePath = Paths.get(schemaStoragePath);
            if (!Files.exists(storagePath)) {
                Files.createDirectories(storagePath);
                logger.info("创建Schema存储目录: {}", storagePath.toAbsolutePath());
            }
        } catch (Exception e) {
            logger.error("创建Schema存储目录失败", e);
            throw new RuntimeException("创建Schema存储目录失败", e);
        }

        // 为所有报表生成Schema文件
        reportRepository.findAll().forEach(report -> {
            try {
                // 如果已经有Schema文件，跳过
                if (StringUtils.hasText(report.getSchemaFile())) {
                    Path existingPath = Paths.get(report.getSchemaFile());
                    if (Files.exists(existingPath)) {
                        logger.debug("报表 {} 已有Schema文件，跳过", report.getReportId());
                        return;
                    }
                }

                // 生成Schema文件
                generateSchemaForReport(report);
            } catch (Exception e) {
                logger.error("为报表 {} 生成Schema文件失败", report.getReportId(), e);
            }
        });

        logger.info("Schema测试数据生成完成");
    }

    /**
     * 为指定报表生成Schema文件
     * 
     * @param report 报表实体
     */
    public void generateSchemaForReport(Report report) {
        try {
            // 生成Schema JSON
            String schemaJson = createExampleSchema(
                    report.getReportId(),
                    report.getReportName(),
                    report.getReportType() != null ? report.getReportType() : "report",
                    report.getCreatorId() != null ? report.getCreatorId() : "user-001"
            );

            // 验证Schema格式
            schemaService.validateSchemaFormat(schemaJson);

            // 计算Hash值
            String hash = schemaService.calculateHash(schemaJson);

            // 生成文件路径
            String fileName = report.getReportId() + "_" + hash.substring(0, 8) + ".json";
            Path filePath = Paths.get(schemaStoragePath, fileName);

            // 保存到文件系统
            Files.write(filePath, schemaJson.getBytes(java.nio.charset.StandardCharsets.UTF_8));

            // 更新数据库中的文件路径
            report.setSchemaFile(filePath.toString());
            reportRepository.save(report);

            logger.info("为报表 {} 生成Schema文件: {}", report.getReportId(), filePath.toAbsolutePath());
        } catch (Exception e) {
            logger.error("为报表 {} 生成Schema文件失败", report.getReportId(), e);
            throw new RuntimeException("生成Schema文件失败: " + e.getMessage(), e);
        }
    }

    /**
     * 创建示例Schema JSON
     * 
     * @param reportId 报表ID
     * @param reportName 报表名称
     * @param reportType 报表类型
     * @param creatorId 创建人ID
     * @return Schema JSON字符串
     */
    private String createExampleSchema(String reportId, String reportName, String reportType, String creatorId) {
        try {
            Map<String, Object> schema = new HashMap<>();
            schema.put("version", "1.0.0");
            schema.put("reportId", reportId);
            schema.put("reportName", reportName);
            schema.put("reportType", reportType);

            // Metadata
            Map<String, Object> metadata = new HashMap<>();
            String now = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
            metadata.put("createTime", now);
            metadata.put("updateTime", now);
            metadata.put("creator", creatorId);
            metadata.put("description", reportName + "的详细描述");
            schema.put("metadata", metadata);

            // Canvas
            Map<String, Object> canvas = new HashMap<>();
            canvas.put("width", 1920);
            canvas.put("height", 1080);
            canvas.put("backgroundColor", "#f5f5f5");
            canvas.put("grid", true);
            canvas.put("gridSize", 10);
            schema.put("canvas", canvas);

            // Components
            Map<String, Object> component = new HashMap<>();
            component.put("componentId", "comp-001");
            component.put("componentType", "barChart");
            component.put("componentName", "数据图表");
            
            Map<String, Object> position = new HashMap<>();
            position.put("x", 100);
            position.put("y", 100);
            component.put("position", position);
            
            Map<String, Object> size = new HashMap<>();
            size.put("width", 600);
            size.put("height", 400);
            component.put("size", size);
            
            component.put("zIndex", 1);
            component.put("visible", true);
            component.put("locked", false);
            
            Map<String, Object> props = new HashMap<>();
            props.put("title", "数据展示");
            props.put("xAxisField", "category");
            props.put("yAxisField", "value");
            props.put("color", "#1890ff");
            props.put("showLegend", true);
            props.put("showTooltip", true);
            component.put("props", props);
            
            Map<String, Object> datasourceConfig = new HashMap<>();
            datasourceConfig.put("sourceType", "static");
            datasourceConfig.put("bindingType", "static");
            Map<String, Object> staticConfig = new HashMap<>();
            java.util.List<Map<String, Object>> data = new java.util.ArrayList<>();
            data.add(createDataItem("类别1", 100));
            data.add(createDataItem("类别2", 200));
            data.add(createDataItem("类别3", 150));
            staticConfig.put("data", data);
            datasourceConfig.put("staticConfig", staticConfig);
            component.put("datasourceConfig", datasourceConfig);
            
            component.put("interactions", new java.util.ArrayList<>());
            
            schema.put("components", java.util.Arrays.asList(component));
            schema.put("datasources", new java.util.ArrayList<>());
            schema.put("interactions", new java.util.ArrayList<>());
            schema.put("i18n", new HashMap<>());

            // 转换为JSON字符串
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(schema);
        } catch (Exception e) {
            throw new RuntimeException("创建Schema JSON失败", e);
        }
    }

    /**
     * 创建数据项
     */
    private Map<String, Object> createDataItem(String category, int value) {
        Map<String, Object> item = new HashMap<>();
        item.put("category", category);
        item.put("value", value);
        return item;
    }
}

