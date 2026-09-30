-- Migration V2: Thêm cột deleted_at cho soft delete
-- và tạo bảng categories để quản lý danh mục

-- Thêm cột deleted_at cho các bảng chính
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE monthly_acceptances ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Tạo bảng categories
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('CUSTOMER', 'EQUIPMENT', 'CONTRACT', 'WORK_TYPE')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Thêm foreign key category cho các bảng
ALTER TABLE customers ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id);

-- Tạo index cho cột category_id
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON contracts(category_id);

-- Tạo index cho deleted_at để filter nhanh
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_equipment_deleted_at ON equipment(deleted_at);
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON contracts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_daily_logs_deleted_at ON daily_logs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_monthly_acceptances_deleted_at ON monthly_acceptances(deleted_at);