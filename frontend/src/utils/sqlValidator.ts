/**
 * SQL查询语句验证工具
 */

export interface SqlValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 验证SQL语句的基本语法
 * @param sql SQL查询语句
 * @param parameters 参数列表
 * @returns 验证结果
 */
export function validateSqlSyntax(sql: string, parameters: Array<{ name: string }> = []): SqlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sql || sql.trim().length === 0) {
    errors.push('SQL查询语句不能为空');
    return { valid: false, errors, warnings };
  }

  const trimmedSql = sql.trim();

  // 检查是否以SELECT开头（只允许查询语句）
  const upperSql = trimmedSql.toUpperCase();
  if (!upperSql.startsWith('SELECT')) {
    errors.push('只允许SELECT查询语句，不允许INSERT、UPDATE、DELETE等修改操作');
  }

  // 检查危险关键字
  const dangerousKeywords = ['DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'DELETE', 'INSERT', 'UPDATE', 'EXEC', 'EXECUTE'];
  for (const keyword of dangerousKeywords) {
    if (upperSql.includes(keyword)) {
      errors.push(`SQL语句包含危险关键字: ${keyword}，查询语句不应包含数据修改操作`);
      break;
    }
  }

  // 检查参数占位符数量
  const placeholderCount = (trimmedSql.match(/\?/g) || []).length;
  if (placeholderCount > 0 && parameters.length === 0) {
    warnings.push(`SQL语句包含 ${placeholderCount} 个参数占位符(?)，但未配置查询参数`);
  } else if (placeholderCount !== parameters.length) {
    errors.push(
      `参数占位符数量(${placeholderCount})与配置的参数数量(${parameters.length})不匹配，请检查SQL语句和参数配置`
    );
  }

  // 检查基本的SQL语法结构
  if (upperSql.includes('SELECT')) {
    // 检查是否有FROM子句
    if (!upperSql.includes('FROM')) {
      errors.push('SELECT语句必须包含FROM子句');
    }

    // 检查括号是否匹配
    const openParens = (trimmedSql.match(/\(/g) || []).length;
    const closeParens = (trimmedSql.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('SQL语句中的括号不匹配');
    }

    // 检查引号是否匹配
    const singleQuotes = (trimmedSql.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      warnings.push('SQL语句中的单引号可能不匹配');
    }

    const doubleQuotes = (trimmedSql.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) {
      warnings.push('SQL语句中的双引号可能不匹配');
    }
  }

  // 检查是否有注释（可能隐藏恶意代码）
  if (trimmedSql.includes('--') || trimmedSql.includes('/*')) {
    warnings.push('SQL语句包含注释，请确保注释内容安全');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 格式化SQL语句（美化显示）
 * @param sql SQL查询语句
 * @returns 格式化后的SQL
 */
export function formatSql(sql: string): string {
  if (!sql || sql.trim().length === 0) {
    return '';
  }

  // 简单的SQL格式化
  let formatted = sql
    .replace(/\s+/g, ' ') // 多个空格替换为单个空格
    .replace(/\s*,\s*/g, ', ') // 逗号前后空格
    .replace(/\s*\(\s*/g, ' (') // 左括号前空格
    .replace(/\s*\)\s*/g, ') ') // 右括号后空格
    .trim();

  // 关键字大写
  const keywords = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'ON', 'AND', 'OR', 'AS', 'LIMIT', 'OFFSET'];
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formatted = formatted.replace(regex, keyword);
  }

  return formatted;
}

