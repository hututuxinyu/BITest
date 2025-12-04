
CREATE TABLE IF NOT EXISTS dataset (
    dataset_id VARCHAR(64) PRIMARY KEY,
    dataset_name VARCHAR(255) NOT NULL,
    description TEXT,
    datasource_id VARCHAR(64),
    datasource_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    creator_id VARCHAR(64),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dataset_creator FOREIGN KEY (creator_id) REFERENCES "user"(user_id)
);

CREATE INDEX idx_dataset_datasource_id ON dataset(datasource_id);
CREATE INDEX idx_dataset_status ON dataset(status);
CREATE INDEX idx_dataset_create_time ON dataset(create_time);

CREATE TABLE IF NOT EXISTS dataset_field (
    field_id VARCHAR(64) PRIMARY KEY,
    dataset_id VARCHAR(64) NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(20) NOT NULL,
    field_label VARCHAR(255),
    tag VARCHAR(20) NOT NULL, 
    description TEXT,
    sort_order INT DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dataset_field_dataset FOREIGN KEY (dataset_id) REFERENCES dataset(dataset_id) ON DELETE CASCADE,
    CONSTRAINT chk_field_tag CHECK (tag IN ('dimension', 'measure')),
    CONSTRAINT chk_field_type CHECK (field_type IN ('string', 'number', 'date', 'boolean'))
);

CREATE INDEX idx_dataset_field_dataset_id ON dataset_field(dataset_id);
CREATE INDEX idx_dataset_field_tag ON dataset_field(tag);
CREATE INDEX idx_dataset_field_sort_order ON dataset_field(sort_order);

INSERT INTO dataset (dataset_id, dataset_name, description, datasource_id, datasource_type, status, creator_id, create_time, update_time) 
VALUES 
    ('dataset-001', '销售数据集', '包含销售相关的维度(时间、地区、产品等)和度量(销售额、数量、利润等)', 'ds-001', 'mysql', 'active', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (dataset_id) DO NOTHING;

INSERT INTO dataset_field (field_id, dataset_id, field_name, field_type, field_label, tag, description, sort_order, create_time) 
VALUES 
    ('field-001-001', 'dataset-001', 'date', 'date', '日期', 'dimension', '销售日期', 1, CURRENT_TIMESTAMP),
    ('field-001-002', 'dataset-001', 'month', 'string', '月份', 'dimension', '销售月份', 2, CURRENT_TIMESTAMP),
    ('field-001-003', 'dataset-001', 'quarter', 'string', '季度', 'dimension', '销售季度', 3, CURRENT_TIMESTAMP),
    ('field-001-004', 'dataset-001', 'year', 'string', '年份', 'dimension', '销售年份', 4, CURRENT_TIMESTAMP),
    ('field-001-005', 'dataset-001', 'region', 'string', '地区', 'dimension', '销售地区', 5, CURRENT_TIMESTAMP),
    ('field-001-006', 'dataset-001', 'city', 'string', '城市', 'dimension', '销售城市', 6, CURRENT_TIMESTAMP),
    ('field-001-007', 'dataset-001', 'product', 'string', '产品', 'dimension', '产品名称', 7, CURRENT_TIMESTAMP),
    ('field-001-008', 'dataset-001', 'category', 'string', '产品类别', 'dimension', '产品分类', 8, CURRENT_TIMESTAMP),
    ('field-001-009', 'dataset-001', 'salesperson', 'string', '销售员', 'dimension', '销售人员', 9, CURRENT_TIMESTAMP),
    ('field-001-010', 'dataset-001', 'channel', 'string', '销售渠道', 'dimension', '销售渠道(线上/线下)', 10, CURRENT_TIMESTAMP),
    ('field-001-011', 'dataset-001', 'amount', 'number', '销售额', 'measure', '销售金额', 11, CURRENT_TIMESTAMP),
    ('field-001-012', 'dataset-001', 'quantity', 'number', '销售数量', 'measure', '销售数量', 12, CURRENT_TIMESTAMP),
    ('field-001-013', 'dataset-001', 'profit', 'number', '利润', 'measure', '销售利润', 13, CURRENT_TIMESTAMP),
    ('field-001-014', 'dataset-001', 'cost', 'number', '成本', 'measure', '销售成本', 14, CURRENT_TIMESTAMP),
    ('field-001-015', 'dataset-001', 'discount', 'number', '折扣金额', 'measure', '折扣金额', 15, CURRENT_TIMESTAMP),
    ('field-001-016', 'dataset-001', 'order_count', 'number', '订单数', 'measure', '订单数量', 16, CURRENT_TIMESTAMP)

INSERT INTO dataset (dataset_id, dataset_name, description, datasource_id, datasource_type, status, creator_id, create_time, update_time) 
VALUES 
    ('dataset-002', '用户数据集', '包含用户相关的维度(用户属性、注册时间、地区等)和度量(访问次数、消费金额、活跃度等)', 'ds-002', 'mysql', 'active', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

INSERT INTO dataset_field (field_id, dataset_id, field_name, field_type, field_label, tag, description, sort_order, create_time) 
VALUES 
    ('field-002-001', 'dataset-002', 'register_date', 'date', '注册日期', 'dimension', '用户注册日期', 1, CURRENT_TIMESTAMP),
    ('field-002-002', 'dataset-002', 'age_group', 'string', '年龄段', 'dimension', '用户年龄段', 2, CURRENT_TIMESTAMP),
    ('field-002-003', 'dataset-002', 'gender', 'string', '性别', 'dimension', '用户性别', 3, CURRENT_TIMESTAMP),
    ('field-002-004', 'dataset-002', 'region', 'string', '地区', 'dimension', '用户所在地区', 4, CURRENT_TIMESTAMP),
    ('field-002-005', 'dataset-002', 'city', 'string', '城市', 'dimension', '用户所在城市', 5, CURRENT_TIMESTAMP),
    ('field-002-006', 'dataset-002', 'user_level', 'string', '用户等级', 'dimension', '用户等级(普通/VIP/超级VIP)', 6, CURRENT_TIMESTAMP),
    ('field-002-007', 'dataset-002', 'device_type', 'string', '设备类型', 'dimension', '用户设备类型(PC/移动端)', 7, CURRENT_TIMESTAMP),
    ('field-002-008', 'dataset-002', 'source', 'string', '来源渠道', 'dimension', '用户来源渠道', 8, CURRENT_TIMESTAMP),
    ('field-002-009', 'dataset-002', 'month', 'string', '月份', 'dimension', '统计月份', 9, CURRENT_TIMESTAMP),
    ('field-002-010', 'dataset-002', 'visit_count', 'number', '访问次数', 'measure', '用户访问次数', 10, CURRENT_TIMESTAMP),
    ('field-002-011', 'dataset-002', 'consumption_amount', 'number', '消费金额', 'measure', '用户消费金额', 11, CURRENT_TIMESTAMP),
    ('field-002-012', 'dataset-002', 'order_count', 'number', '订单数', 'measure', '用户订单数量', 12, CURRENT_TIMESTAMP),
    ('field-002-013', 'dataset-002', 'active_days', 'number', '活跃天数', 'measure', '用户活跃天数', 13, CURRENT_TIMESTAMP),
    ('field-002-014', 'dataset-002', 'session_duration', 'number', '会话时长', 'measure', '平均会话时长(分钟)', 14, CURRENT_TIMESTAMP),
    ('field-002-015', 'dataset-002', 'page_views', 'number', '页面浏览量', 'measure', '页面浏览量', 15, CURRENT_TIMESTAMP)

INSERT INTO dataset (dataset_id, dataset_name, description, datasource_id, datasource_type, status, creator_id, create_time, update_time) 
VALUES 
    ('dataset-003', '产品数据集', '包含产品相关的维度(产品类别、品牌、价格区间等)和度量(库存、销量、评分等)', 'ds-003', 'mysql', 'active', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

INSERT INTO dataset_field (field_id, dataset_id, field_name, field_type, field_label, tag, description, sort_order, create_time) 
VALUES 
    ('field-003-001', 'dataset-003', 'category', 'string', '产品类别', 'dimension', '产品分类', 1, CURRENT_TIMESTAMP),
    ('field-003-002', 'dataset-003', 'subcategory', 'string', '子类别', 'dimension', '产品子分类', 2, CURRENT_TIMESTAMP),
    ('field-003-003', 'dataset-003', 'brand', 'string', '品牌', 'dimension', '产品品牌', 3, CURRENT_TIMESTAMP),
    ('field-003-004', 'dataset-003', 'price_range', 'string', '价格区间', 'dimension', '产品价格区间', 4, CURRENT_TIMESTAMP),
    ('field-003-005', 'dataset-003', 'status', 'string', '产品状态', 'dimension', '产品状态(在售/下架)', 5, CURRENT_TIMESTAMP),
    ('field-003-006', 'dataset-003', 'supplier', 'string', '供应商', 'dimension', '产品供应商', 6, CURRENT_TIMESTAMP),
    ('field-003-007', 'dataset-003', 'launch_date', 'date', '上市日期', 'dimension', '产品上市日期', 7, CURRENT_TIMESTAMP),
    ('field-003-008', 'dataset-003', 'month', 'string', '月份', 'dimension', '统计月份', 8, CURRENT_TIMESTAMP),
    ('field-003-009', 'dataset-003', 'stock', 'number', '库存数量', 'measure', '产品库存数量', 9, CURRENT_TIMESTAMP),
    ('field-003-010', 'dataset-003', 'sales_volume', 'number', '销量', 'measure', '产品销售数量', 10, CURRENT_TIMESTAMP),
    ('field-003-011', 'dataset-003', 'sales_amount', 'number', '销售额', 'measure', '产品销售金额', 11, CURRENT_TIMESTAMP),
    ('field-003-012', 'dataset-003', 'rating', 'number', '评分', 'measure', '产品评分(1-5分)', 12, CURRENT_TIMESTAMP),
    ('field-003-013', 'dataset-003', 'review_count', 'number', '评论数', 'measure', '产品评论数量', 13, CURRENT_TIMESTAMP),
    ('field-003-014', 'dataset-003', 'return_rate', 'number', '退货率', 'measure', '产品退货率(百分比)', 14, CURRENT_TIMESTAMP),
    ('field-003-015', 'dataset-003', 'profit_margin', 'number', '利润率', 'measure', '产品利润率(百分比)', 15, CURRENT_TIMESTAMP)

INSERT INTO dataset (dataset_id, dataset_name, description, datasource_id, datasource_type, status, creator_id, create_time, update_time) 
VALUES 
    ('dataset-004', '财务数据集', '包含财务相关的维度(会计期间、部门、科目等)和度量(收入、支出、利润等)', 'ds-004', 'mysql', 'active', 'user-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

INSERT INTO dataset_field (field_id, dataset_id, field_name, field_type, field_label, tag, description, sort_order, create_time) 
VALUES 
    ('field-004-001', 'dataset-004', 'accounting_period', 'string', '会计期间', 'dimension', '会计期间(年月)', 1, CURRENT_TIMESTAMP),
    ('field-004-002', 'dataset-004', 'date', 'date', '日期', 'dimension', '财务日期', 2, CURRENT_TIMESTAMP),
    ('field-004-003', 'dataset-004', 'month', 'string', '月份', 'dimension', '财务月份', 3, CURRENT_TIMESTAMP),
    ('field-004-004', 'dataset-004', 'quarter', 'string', '季度', 'dimension', '财务季度', 4, CURRENT_TIMESTAMP),
    ('field-004-005', 'dataset-004', 'year', 'string', '年份', 'dimension', '财务年份', 5, CURRENT_TIMESTAMP),
    ('field-004-006', 'dataset-004', 'department', 'string', '部门', 'dimension', '财务部门', 6, CURRENT_TIMESTAMP),
    ('field-004-007', 'dataset-004', 'account', 'string', '科目', 'dimension', '会计科目', 7, CURRENT_TIMESTAMP),
    ('field-004-008', 'dataset-004', 'account_type', 'string', '科目类型', 'dimension', '科目类型(收入/支出/资产/负债)', 8, CURRENT_TIMESTAMP),
    ('field-004-009', 'dataset-004', 'project', 'string', '项目', 'dimension', '财务项目', 9, CURRENT_TIMESTAMP),
    ('field-004-010', 'dataset-004', 'currency', 'string', '币种', 'dimension', '货币类型', 10, CURRENT_TIMESTAMP),
    ('field-004-011', 'dataset-004', 'revenue', 'number', '收入', 'measure', '财务收入', 11, CURRENT_TIMESTAMP),
    ('field-004-012', 'dataset-004', 'expense', 'number', '支出', 'measure', '财务支出', 12, CURRENT_TIMESTAMP),
    ('field-004-013', 'dataset-004', 'profit', 'number', '利润', 'measure', '净利润', 13, CURRENT_TIMESTAMP),
    ('field-004-014', 'dataset-004', 'budget', 'number', '预算', 'measure', '预算金额', 14, CURRENT_TIMESTAMP),
    ('field-004-015', 'dataset-004', 'actual', 'number', '实际金额', 'measure', '实际金额', 15, CURRENT_TIMESTAMP),
    ('field-004-016', 'dataset-004', 'variance', 'number', '差异', 'measure', '预算与实际差异', 16, CURRENT_TIMESTAMP),
    ('field-004-017', 'dataset-004', 'balance', 'number', '余额', 'measure', '账户余额', 17, CURRENT_TIMESTAMP)
ON CONFLICT (field_id) DO NOTHING;