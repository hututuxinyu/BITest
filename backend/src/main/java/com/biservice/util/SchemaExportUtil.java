package com.biservice.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.stereotype.Component;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Schema导出工具类
 * 提供JSON格式化、文件命名、ZIP压缩等工具方法
 * 
 * @author BI Service Team
 */
@Component
public class SchemaExportUtil {

    private final ObjectMapper objectMapper;

    public SchemaExportUtil() {
        this.objectMapper = new ObjectMapper();
        // 配置JSON格式化，美化输出
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * 格式化JSON字符串（美化输出）
     * 
     * @param jsonString JSON字符串
     * @return 格式化后的JSON字符串
     * @throws IOException IO异常
     */
    public String formatJson(String jsonString) throws IOException {
        Object json = objectMapper.readValue(jsonString, Object.class);
        return objectMapper.writeValueAsString(json);
    }

    /**
     * 格式化对象为JSON字符串
     * 
     * @param object 对象
     * @return 格式化后的JSON字符串
     * @throws IOException IO异常
     */
    public String formatJson(Object object) throws IOException {
        return objectMapper.writeValueAsString(object);
    }

    /**
     * 生成Schema文件名
     * 
     * @param reportName 报表名称
     * @param reportId 报表ID
     * @param schemaVersion Schema版本号（可选）
     * @return 文件名
     */
    public String generateSchemaFileName(String reportName, String reportId, String schemaVersion) {
        // 清理文件名中的非法字符
        String safeName = sanitizeFileName(reportName);
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        
        if (schemaVersion != null && !schemaVersion.isEmpty()) {
            return String.format("%s_%s_v%s_%s.json", safeName, reportId, schemaVersion, timestamp);
        } else {
            return String.format("%s_%s_%s.json", safeName, reportId, timestamp);
        }
    }

    /**
     * 生成ZIP文件名
     * 
     * @param projectName 工程名称
     * @param projectId 工程ID
     * @return ZIP文件名
     */
    public String generateZipFileName(String projectName, String projectId) {
        String safeName = sanitizeFileName(projectName);
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        return String.format("%s_%s_schemas_%s.zip", safeName, projectId, timestamp);
    }

    /**
     * 清理文件名中的非法字符
     * 
     * @param fileName 原始文件名
     * @return 清理后的文件名
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return "unnamed";
        }
        // 替换非法字符为下划线
        return fileName.replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5_\\-]", "_")
                .replaceAll("_{2,}", "_")
                .trim();
    }

    /**
     * 将多个Schema文件打包成ZIP
     * 
     * @param schemaFiles Schema文件列表（文件名 -> 文件内容）
     * @return ZIP文件的字节数组
     * @throws IOException IO异常
     */
    public byte[] createZipFile(java.util.Map<String, String> schemaFiles) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {
            for (java.util.Map.Entry<String, String> entry : schemaFiles.entrySet()) {
                String fileName = entry.getKey();
                String content = entry.getValue();
                
                ZipEntry zipEntry = new ZipEntry(fileName);
                zos.putNextEntry(zipEntry);
                zos.write(content.getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            }
        }
        return baos.toByteArray();
    }

    /**
     * 将多个Schema文件打包成ZIP（使用字节数组）
     * 
     * @param schemaFiles Schema文件列表（文件名 -> 文件内容字节数组）
     * @return ZIP文件的字节数组
     * @throws IOException IO异常
     */
    public byte[] createZipFileFromBytes(java.util.Map<String, byte[]> schemaFiles) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {
            for (java.util.Map.Entry<String, byte[]> entry : schemaFiles.entrySet()) {
                String fileName = entry.getKey();
                byte[] content = entry.getValue();
                
                ZipEntry zipEntry = new ZipEntry(fileName);
                zos.putNextEntry(zipEntry);
                zos.write(content);
                zos.closeEntry();
            }
        }
        return baos.toByteArray();
    }

    /**
     * 获取ObjectMapper实例
     * 
     * @return ObjectMapper实例
     */
    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }
}

