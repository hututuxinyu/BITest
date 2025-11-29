# ============================================
# Schema测试文件生成脚本 (PowerShell版本)
# 说明：为测试报表发布功能，创建真实的Schema文件
# 使用方法：.\seed_schema_files.ps1
# ============================================

# Schema存储目录
$SCHEMA_DIR = ".\schema-storage"

# 创建存储目录
Write-Host "创建Schema存储目录: $SCHEMA_DIR" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $SCHEMA_DIR | Out-Null

# 生成Schema文件的函数
function Generate-SchemaFile {
    param(
        [string]$ReportId,
        [string]$ReportName,
        [string]$ReportType,
        [string]$Status,
        [string]$HashPrefix,
        [string]$CreatorId
    )
    
    $filePath = Join-Path $SCHEMA_DIR "${ReportId}_${HashPrefix}.json"
    
    # 生成Schema JSON
    $schemaJson = @{
        version = "1.0.0"
        reportId = $ReportId
        reportName = $ReportName
        reportType = $ReportType
        metadata = @{
            createTime = "2024-01-15T10:30:00Z"
            updateTime = "2024-01-20T14:20:00Z"
            creator = $CreatorId
            description = "$ReportName的详细描述"
        }
        canvas = @{
            width = 1920
            height = 1080
            backgroundColor = "#f5f5f5"
            grid = $true
            gridSize = 10
        }
        components = @(
            @{
                componentId = "comp-001"
                componentType = "barChart"
                componentName = "数据图表"
                position = @{
                    x = 100
                    y = 100
                }
                size = @{
                    width = 600
                    height = 400
                }
                zIndex = 1
                visible = $true
                locked = $false
                props = @{
                    title = "数据展示"
                    xAxisField = "category"
                    yAxisField = "value"
                    color = "#1890ff"
                    showLegend = $true
                    showTooltip = $true
                }
                datasourceConfig = @{
                    sourceType = "static"
                    bindingType = "static"
                    staticConfig = @{
                        data = @(
                            @{ category = "类别1"; value = 100 }
                            @{ category = "类别2"; value = 200 }
                            @{ category = "类别3"; value = 150 }
                        )
                    }
                }
                interactions = @()
            }
        )
        datasources = @()
        interactions = @()
        i18n = @{}
    }
    
    # 转换为JSON并保存
    $schemaJson | ConvertTo-Json -Depth 10 | Set-Content -Path $filePath -Encoding UTF8
    
    Write-Host "✅ 创建Schema文件: $filePath" -ForegroundColor Green
}

# 生成所有测试Schema文件
Write-Host "开始生成Schema测试文件..." -ForegroundColor Yellow
Write-Host ""

# report-001: 月度销售报表 (已发布)
Generate-SchemaFile "report-001" "月度销售报表" "report" "published" "a1b2c3d4" "user-001"

# report-002: 销售趋势分析 (已发布)
Generate-SchemaFile "report-002" "销售趋势分析" "dashboard" "published" "e5f6g7h8" "user-001"

# report-003: 区域销售对比 (草稿，用于测试发布功能)
Generate-SchemaFile "report-003" "区域销售对比" "report" "draft" "i9j0k1l2" "user-001"

# report-004: 财务报表汇总 (已发布)
Generate-SchemaFile "report-004" "财务报表汇总" "report" "published" "m3n4o5p6" "user-001"

# report-005: 成本分析报表 (草稿，用于测试发布功能)
Generate-SchemaFile "report-005" "成本分析报表" "report" "draft" "q7r8s9t0" "user-001"

# report-006: 运营实时监控 (已发布)
Generate-SchemaFile "report-006" "运营实时监控" "dashboard" "published" "u1v2w3x4" "user-002"

# report-007: 库存统计报表 (已发布)
Generate-SchemaFile "report-007" "库存统计报表" "report" "published" "y5z6a7b8" "user-003"

Write-Host ""
Write-Host "✅ 所有Schema测试文件生成完成！" -ForegroundColor Green
Write-Host "文件位置: $SCHEMA_DIR" -ForegroundColor Yellow
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "1. 执行SQL脚本更新数据库路径: psql -U postgres -d biservice -f database/seed_schema_test_data.sql"
Write-Host "2. 或者手动更新数据库中的schema_file字段"

