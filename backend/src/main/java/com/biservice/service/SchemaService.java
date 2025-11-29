package com.biservice.service;

import com.biservice.entity.Report;
import com.biservice.entity.SchemaAuditLog;
import com.biservice.entity.SchemaVersionHistory;
import com.biservice.repository.ReportRepository;
import com.biservice.repository.SchemaAuditLogRepository;
import com.biservice.repository.SchemaVersionHistoryRepository;
import com.biservice.util.SchemaExportUtil;
import com.biservice.util.SchemaValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Schema服务类
 * 实现schema的保存、读取、验证功能
 * 
 * @author BI Service Team
 */
@Service
public class SchemaService {

    private static final Logger logger = LoggerFactory.getLogger(SchemaService.class);
    private static final String SHA_256 = "SHA-256";

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private SchemaVersionHistoryRepository schemaVersionHistoryRepository;

    @Autowired
    private SchemaAuditLogRepository schemaAuditLogRepository;

    @Autowired
    private SchemaExportUtil schemaExportUtil;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SchemaValidator schemaValidator;

    /**
     * Schema文件存储根目录（如果使用文件系统存储）
     */
    @Value("${schema.storage.path:./schema-storage}")
    private String schemaStoragePath;

    /**
     * Schema存储方式：database-数据库，filesystem-文件系统
     */
    @Value("${schema.storage.type:database}")
    private String storageType;

    /**
     * 保存Schema到报表
     * 
     * @param reportId 报表ID
     * @param schemaJson Schema JSON字符串
     * @param userId 用户ID
     * @param userIp 用户IP
     * @return 保存结果
     */
    @Transactional
    public void saveSchema(String reportId, String schemaJson, String userId, String userIp) {
        try {
            // 验证Schema格式
            validateSchemaFormat(schemaJson);

            // 计算哈希值
            String hash = calculateHash(schemaJson);

            // 获取报表
            Optional<Report> reportOpt = reportRepository.findById(reportId);
            if (!reportOpt.isPresent()) {
                throw new RuntimeException("报表不存在");
            }

            Report report = reportOpt.get();

            // 保存版本历史（如果存在旧版本）
            if (report.getVersion() != null && report.getSchemaFile() != null) {
                saveVersionHistory(report, userId);
            }

            // 根据存储方式保存Schema
            if ("filesystem".equalsIgnoreCase(storageType)) {
                saveToFileSystem(reportId, schemaJson, hash);
            } else {
                saveToDatabase(report, schemaJson, hash);
            }

            // 记录审计日志
            recordAuditLog(reportId, "save", "success", userId, userIp, null);

            logger.info("Schema保存成功，报表ID: {}", reportId);
        } catch (Exception e) {
            logger.error("Schema保存失败，报表ID: {}", reportId, e);
            recordAuditLog(reportId, "save", "failed", userId, userIp, e.getMessage());
            throw new RuntimeException("Schema保存失败: " + e.getMessage(), e);
        }
    }

    /**
     * 从报表读取Schema
     * 
     * @param reportId 报表ID
     * @return Schema JSON字符串
     */
    public String readSchema(String reportId) {
        Optional<Report> reportOpt = reportRepository.findById(reportId);
        if (!reportOpt.isPresent()) {
            throw new RuntimeException("报表不存在");
        }

        Report report = reportOpt.get();

        try {
            String schemaJson;
            if ("filesystem".equalsIgnoreCase(storageType) && report.getSchemaFile() != null) {
                schemaJson = readFromFileSystem(report.getSchemaFile());
            } else {
                // 如果schema_file存在，从文件读取；否则抛出异常
                if (report.getSchemaFile() != null) {
                    schemaJson = readFromFileSystem(report.getSchemaFile());
                } else {
                    throw new RuntimeException("Schema文件路径不存在");
                }
            }

            // 验证Schema格式（可选，如果Schema可能被外部修改）
            // validateSchemaFormat(schemaJson);

            return schemaJson;
        } catch (Exception e) {
            logger.error("Schema读取失败，报表ID: {}", reportId, e);
            throw new RuntimeException("Schema读取失败: " + e.getMessage(), e);
        }
    }

    /**
     * 验证Schema是否符合规范（不抛出异常，返回验证结果）
     * 
     * @param schemaJson Schema JSON字符串
     * @return 验证结果
     */
    public SchemaValidator.SchemaValidationResult validateSchema(String schemaJson) {
        return schemaValidator.validate(schemaJson);
    }

    /**
     * 验证Schema格式
     * 
     * @param schemaJson Schema JSON字符串
     * @throws IllegalArgumentException Schema格式验证失败
     */
    public void validateSchemaFormat(String schemaJson) {
        if (!StringUtils.hasText(schemaJson)) {
            throw new IllegalArgumentException("Schema内容不能为空");
        }

        // 验证是否为有效的JSON
        try {
            objectMapper.readTree(schemaJson);
        } catch (Exception e) {
            throw new IllegalArgumentException("Schema格式无效: " + e.getMessage(), e);
        }

        // 使用JSON Schema验证器验证Schema是否符合report-schema.json规范
        SchemaValidator.SchemaValidationResult validationResult = schemaValidator.validate(schemaJson);
        if (!validationResult.isValid()) {
            String errorMessage = "Schema验证失败: " + validationResult.getErrorMessage();
            logger.warn(errorMessage);
            throw new IllegalArgumentException(errorMessage);
        }

        logger.debug("Schema验证通过");
    }

    /**
     * 计算Schema的SHA-256哈希值
     * 
     * @param schemaJson Schema JSON字符串
     * @return 哈希值（十六进制字符串）
     */
    public String calculateHash(String schemaJson) {
        try {
            MessageDigest digest = MessageDigest.getInstance(SHA_256);
            byte[] hashBytes = digest.digest(schemaJson.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("哈希算法不可用", e);
        }
    }

    /**
     * 验证Schema哈希值
     * 
     * @param schemaJson Schema JSON字符串
     * @param expectedHash 期望的哈希值
     * @return 是否匹配
     */
    public boolean verifyHash(String schemaJson, String expectedHash) {
        String actualHash = calculateHash(schemaJson);
        return actualHash.equals(expectedHash);
    }

    /**
     * 保存到数据库（实际保存到文件系统，更新schema_file字段）
     */
    private void saveToDatabase(Report report, String schemaJson, String hash) throws IOException {
        // 生成文件路径
        String fileName = report.getReportId() + "_" + hash.substring(0, 8) + ".json";
        Path filePath = Paths.get(schemaStoragePath, fileName);
        
        // 确保目录存在
        Files.createDirectories(filePath.getParent());
        
        // 保存到文件系统
        Files.write(filePath, schemaJson.getBytes(StandardCharsets.UTF_8));
        
        // 更新报表的schema_file字段
        report.setSchemaFile(filePath.toString());
        report.setUpdateTime(LocalDateTime.now());
        // 如果版本为空，设置默认版本
        if (report.getVersion() == null) {
            report.setVersion("1.0.0");
        }
        reportRepository.save(report);
    }

    /**
     * 保存到文件系统
     */
    private void saveToFileSystem(String reportId, String schemaJson, String hash) throws IOException {
        Optional<Report> reportOpt = reportRepository.findById(reportId);
        if (reportOpt.isPresent()) {
            saveToDatabase(reportOpt.get(), schemaJson, hash);
        }
    }

    /**
     * 从文件系统读取
     */
    private String readFromFileSystem(String filePath) throws IOException {
        if (!StringUtils.hasText(filePath)) {
            throw new RuntimeException("Schema文件路径为空");
        }
        Path path = Paths.get(filePath);
        if (!Files.exists(path)) {
            throw new RuntimeException("Schema文件不存在: " + filePath);
        }
        return new String(Files.readAllBytes(path), StandardCharsets.UTF_8);
    }

    /**
     * 保存版本历史（简化版本，仅保存基本版本信息）
     */
    private void saveVersionHistory(Report report, String userId) {
        SchemaVersionHistory history = new SchemaVersionHistory();
        history.setVersionHistoryId(UUID.randomUUID().toString());
        history.setReportId(report.getReportId());
        history.setSchemaVersion(report.getVersion());
        // 简化版本历史，不再保存复杂的版本信息
        history.setChangeType("updated");
        history.setChangeDescription("Schema更新");
        history.setCreatedBy(userId);
        history.setCreatedTime(LocalDateTime.now());
        // 注意：SchemaVersionHistory实体可能也需要简化，这里仅做基本适配
        schemaVersionHistoryRepository.save(history);
    }

    /**
     * 记录审计日志
     * 
     * @param reportId 报表ID
     * @param operationType 操作类型
     * @param operationResult 操作结果
     * @param userId 用户ID
     * @param userIp 用户IP
     * @param errorMessage 错误消息
     */
    public void recordAuditLog(String reportId, String operationType, String operationResult, 
                                String userId, String userIp, String errorMessage) {
        try {
            SchemaAuditLog auditLog = new SchemaAuditLog();
            auditLog.setAuditLogId(UUID.randomUUID().toString());
            auditLog.setReportId(reportId);
            auditLog.setOperationType(operationType);
            auditLog.setOperationResult(operationResult);
            auditLog.setUserId(userId);
            auditLog.setUserIp(userIp);
            auditLog.setErrorMessage(errorMessage);
            auditLog.setCreatedTime(LocalDateTime.now());
            schemaAuditLogRepository.save(auditLog);
        } catch (Exception e) {
            logger.error("记录审计日志失败", e);
        }
    }

    /**
     * 字节数组转十六进制字符串
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}

