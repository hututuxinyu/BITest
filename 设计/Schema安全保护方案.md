# Schema安全保护方案

## 1. 概述

本文档针对报表BI系统中Schema文件携带SQL语句的安全性问题，提出了一套完整的安全保护方案。该方案从Schema文件完整性保护、SQL语句安全验证、权限控制、审计日志等多个维度，确保Schema中的SQL语句不被恶意修改，保障系统安全。

## 2. 安全风险分析

### 2.1 主要安全风险

1. **Schema文件被恶意篡改**：
   - 攻击者可能直接修改Schema文件中的SQL语句
   - 注入恶意SQL代码（如DROP TABLE、DELETE等危险操作）
   - 修改数据源配置，指向恶意数据库

2. **SQL注入风险**：
   - 即使Schema文件未被篡改，SQL语句本身可能存在注入漏洞
   - 参数化查询配置不当可能导致SQL注入

3. **权限绕过风险**：
   - 通过修改Schema绕过权限控制
   - 修改数据权限配置，访问未授权数据

4. **数据泄露风险**：
   - 修改SQL查询条件，访问敏感数据
   - 修改数据源配置，将数据导出到外部系统

### 2.2 攻击场景

- **场景一**：攻击者获取Schema文件访问权限，直接修改SQL语句
- **场景二**：攻击者在设计态界面中注入恶意SQL代码
- **场景三**：攻击者通过中间人攻击，在Schema传输过程中篡改内容
- **场景四**：攻击者利用系统漏洞，绕过权限验证修改Schema

## 3. 安全保护方案

### 3.1 Schema文件完整性保护

#### 3.1.1 数字签名机制

**方案描述**：
在设计态生成Schema文件时，对Schema文件进行数字签名，运行态加载Schema时验证签名，确保文件未被篡改。
当前已经支持数字签名功能，但现网可以关闭签名校验的功能。

### 3.2 SQL语句安全验证

#### 3.2.1 SQL白名单机制

**方案描述**：
维护一个SQL语句白名单，运行态执行SQL前，验证SQL是否在白名单中。
该方案灵活性不够好，不建议采纳。

#### 3.2.2 SQL语法和关键字检查

**方案描述**：
运行态执行SQL前，检查SQL语句中是否包含危险关键字和操作。

**实现方式**：

1. **危险关键字黑名单**：
   - 定义危险SQL关键字列表（如DROP、DELETE、TRUNCATE、ALTER、CREATE等）
   - 运行态执行SQL前，检查SQL中是否包含这些关键字
   - 如果包含危险关键字，拒绝执行并记录安全日志

2. **只读SQL验证**：
   - 对于报表查询场景，只允许SELECT语句
   - 解析SQL语句，验证是否为SELECT语句
   - 非SELECT语句拒绝执行

3. **SQL复杂度限制**：
   - 限制SQL语句的长度
   - 限制SQL语句的嵌套深度
   - 限制子查询的数量

**技术实现**：
```typescript
// SQL安全检查
class SQLSecurityChecker {
  private readonly DANGEROUS_KEYWORDS = [
    'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE',
    'INSERT', 'UPDATE', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE'
  ];
  
  async checkSQLSecurity(sql: string): Promise<SecurityCheckResult> {
    const upperSQL = sql.toUpperCase();
    
    // 1. 检查危险关键字
    for (const keyword of this.DANGEROUS_KEYWORDS) {
      if (upperSQL.includes(keyword)) {
        return {
          safe: false,
          reason: `SQL包含危险关键字: ${keyword}`
        };
      }
    }
    
    // 2. 验证是否为SELECT语句
    if (!upperSQL.trim().startsWith('SELECT')) {
      return {
        safe: false,
        reason: '只允许SELECT查询语句'
      };
    }
    
    // 3. 检查SQL长度
    if (sql.length > 10000) {
      return {
        safe: false,
        reason: 'SQL语句过长'
      };
    }
    
    return { safe: true };
  }
}
```

#### 3.2.3 参数化查询强制

**方案描述**：
强制要求所有SQL语句使用参数化查询，防止SQL注入。

**实现方式**：
- 设计态生成Schema时，验证SQL是否使用参数化查询（使用?或:param占位符）
- 运行态执行SQL时，严格使用参数化查询，禁止字符串拼接
- 对参数值进行类型验证和范围检查

**技术实现**：
```typescript
// 参数化查询验证
class ParameterizedQueryValidator {
  validateParameterizedQuery(sql: string, parameters: any[]): boolean {
    // 检查SQL中是否包含参数占位符
    const placeholderCount = (sql.match(/\?/g) || []).length;
    
    // 检查参数数量是否匹配
    if (placeholderCount !== parameters.length) {
      throw new ValidationException('SQL参数数量不匹配');
    }
    
    // 验证参数类型
    for (const param of parameters) {
      this.validateParameterType(param);
    }
    
    return true;
  }
}
```
### 3.3 审计日志

#### 3.3.1 SQL执行审计

**方案描述**：
记录所有SQL执行操作，包括执行的SQL语句、参数、执行结果等。

**审计内容**：
- SQL语句
- SQL参数
- 执行时间
- 执行用户
- 数据源信息
- 执行结果（成功/失败）
- 影响行数（如果适用）

### 3.5 版本控制和回滚

#### 3.5.1 Schema版本管理

**方案描述**：
完善的版本控制机制，支持Schema版本追溯和回滚。

**实现方式**：
- 每次Schema修改都创建新版本
- 保存所有历史版本的Schema文件
- 记录每个版本的变更内容
- 支持版本对比和差异分析
- 支持回滚到历史版本

#### 3.5.2 变更追踪

**方案描述**：
追踪Schema中SQL语句的变更历史。

**实现方式**：
- 记录每次SQL语句的变更
- 对比不同版本的SQL差异
- 标记可疑的SQL变更（如突然出现危险关键字）
- 对可疑变更进行人工审核

### 3.6 传输安全

#### 3.6.1 加密传输

**方案描述**：
Schema文件在传输过程中使用HTTPS加密，防止中间人攻击。

**实现方式**：
- 设计态和运行态之间的通信使用HTTPS
- Schema文件传输使用TLS 1.2或更高版本
- 使用证书固定（Certificate Pinning）增强安全性

#### 3.6.2 完整性校验

**方案描述**：
传输过程中校验Schema文件的完整性。

**实现方式**：
- 传输前计算Schema文件的哈希值
- 传输后重新计算哈希值并对比
- 哈希值不匹配则拒绝接收


## 7. 总结

本方案通过数字签名、SQL白名单、权限控制、审计日志等多层安全机制，全面保护Schema中SQL语句的安全性。该方案具有以下特点：

1. **多层防护**：从文件完整性、SQL验证、权限控制等多个维度提供保护
2. **可追溯性**：完善的审计日志和版本控制，支持安全事件追溯
3. **可扩展性**：方案设计支持后续扩展和优化
4. **实用性**：方案考虑了实际实施的可操作性

通过实施本方案，可以有效防止Schema中SQL语句被恶意修改，保障系统安全。

