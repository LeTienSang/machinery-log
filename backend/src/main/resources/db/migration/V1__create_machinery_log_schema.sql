CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_users_role CHECK (role IN ('OPERATOR', 'ACCOUNTANT_ADMIN'))
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(50),
    representative_name VARCHAR(100),
    position VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    equipment_name VARCHAR(255) NOT NULL,
    serial_registration_number VARCHAR(100) NOT NULL,
    equipment_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id),
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    signing_date DATE,
    project_name TEXT,
    construction_site TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_contracts_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'TERMINATED'))
);

CREATE TABLE pricing_appendices (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contracts(id),
    equipment_id INT NOT NULL REFERENCES equipment(id),
    pricing_type VARCHAR(50) NOT NULL DEFAULT 'HOURLY',
    unit_price DECIMAL(15, 2) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'Hours',
    CONSTRAINT ck_pricing_appendices_type CHECK (pricing_type IN ('HOURLY', 'DAILY', 'MONTHLY')),
    CONSTRAINT ck_pricing_appendices_unit_price CHECK (unit_price > 0)
);

CREATE TABLE daily_logs (
    id SERIAL PRIMARY KEY,
    operator_id INT REFERENCES users(id),
    contract_id INT NOT NULL REFERENCES contracts(id),
    equipment_id INT NOT NULL REFERENCES equipment(id),
    work_date DATE NOT NULL,
    work_description TEXT,
    morning_start_time VARCHAR(10),
    morning_end_time VARCHAR(10),
    afternoon_start_time VARCHAR(10),
    afternoon_end_time VARCHAR(10),
    evening_start_time VARCHAR(10),
    evening_end_time VARCHAR(10),
    operating_hours DECIMAL(5, 2) NOT NULL DEFAULT 0.0,
    standby_hours DECIMAL(5, 2) NOT NULL DEFAULT 0.0,
    operator_name VARCHAR(100),
    original_image_url TEXT,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    reviewer_id INT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_daily_logs_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT ck_daily_logs_rejection_reason CHECK (
        approval_status <> 'REJECTED'
        OR NULLIF(BTRIM(rejection_reason), '') IS NOT NULL
    ),
    CONSTRAINT ck_daily_logs_hours CHECK (operating_hours >= 0 AND standby_hours >= 0)
);

CREATE TABLE monthly_acceptances (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contracts(id),
    equipment_id INT NOT NULL REFERENCES equipment(id),
    billing_month VARCHAR(7) NOT NULL,
    from_date DATE,
    to_date DATE,
    total_operating_hours DECIMAL(8, 2),
    applied_unit_price DECIMAL(15, 2),
    subtotal_before_vat DECIMAL(15, 2),
    vat_percentage INT NOT NULL DEFAULT 8,
    vat_amount DECIMAL(15, 2),
    total_amount DECIMAL(15, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_SIGNATURE',
    export_version INT NOT NULL DEFAULT 1,
    last_exported_at TIMESTAMP,
    export_invalidated_at TIMESTAMP,
    CONSTRAINT ck_monthly_acceptances_billing_month CHECK (billing_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT ck_monthly_acceptances_status CHECK (status IN ('PENDING_SIGNATURE', 'SIGNED', 'NEEDS_RECALCULATION')),
    CONSTRAINT ck_monthly_acceptances_vat CHECK (vat_percentage BETWEEN 0 AND 100),
    CONSTRAINT ck_monthly_acceptances_hours CHECK (total_operating_hours IS NULL OR total_operating_hours >= 0)
);

CREATE TABLE advance_payments (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contracts(id),
    document_date DATE NOT NULL,
    document_number VARCHAR(100),
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    CONSTRAINT ck_advance_payments_amount CHECK (amount >= 0)
);

CREATE TABLE debt_reconciliations (
    id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contracts(id),
    reconciliation_date DATE,
    previous_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_period_acceptance DECIMAL(15, 2),
    total_paid DECIMAL(15, 2),
    remaining_balance DECIMAL(15, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_RECONCILIATION',
    CONSTRAINT ck_debt_reconciliations_status CHECK (status IN ('PENDING_RECONCILIATION', 'RECONCILED'))
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id INT REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    request_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_audit_logs_action CHECK (
        action IN ('CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'REOPEN', 'SIGN',
                   'RECONCILE', 'EXPORT_CREATED', 'EXPORT_INVALIDATED')
    )
);

CREATE INDEX idx_daily_logs_contract_date ON daily_logs(contract_id, work_date);
CREATE INDEX idx_daily_logs_operator ON daily_logs(operator_id);
CREATE INDEX idx_daily_logs_reviewer ON daily_logs(reviewer_id);
CREATE INDEX idx_daily_logs_contract_equipment_status
    ON daily_logs(contract_id, equipment_id, approval_status);
CREATE INDEX idx_audit_logs_entity_created ON audit_logs(entity_type, entity_id, created_at);
CREATE INDEX idx_audit_logs_actor_created ON audit_logs(actor_user_id, created_at);
CREATE INDEX idx_monthly_acceptances_contract_month
    ON monthly_acceptances(contract_id, billing_month);

-- The fresh-install path has no legacy rows. This gate is intentionally retained so
-- a copied migration cannot silently accept incomplete operator ownership data.
CREATE TEMP TABLE operator_backfill_map (
    daily_log_id INT PRIMARY KEY REFERENCES daily_logs(id),
    operator_id INT NOT NULL REFERENCES users(id)
);

UPDATE daily_logs AS dl
SET operator_id = mapping.operator_id
FROM operator_backfill_map AS mapping
WHERE dl.id = mapping.daily_log_id
  AND dl.operator_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM daily_logs WHERE operator_id IS NULL) THEN
        RAISE EXCEPTION 'Backfill operator_id is incomplete';
    END IF;
END $$;

-- Archive and remove duplicate acceptance rows before the unique constraint is applied.
CREATE TABLE monthly_acceptances_dedup_archive AS
SELECT ranked.*, CURRENT_TIMESTAMP AS archived_at
FROM (
    SELECT ma.*,
           ROW_NUMBER() OVER (
               PARTITION BY contract_id, equipment_id, billing_month
               ORDER BY id DESC
           ) AS duplicate_rank
    FROM monthly_acceptances AS ma
) AS ranked
WHERE ranked.duplicate_rank > 1;

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY contract_id, equipment_id, billing_month
               ORDER BY id DESC
           ) AS duplicate_rank
    FROM monthly_acceptances
)
DELETE FROM monthly_acceptances AS ma
USING ranked
WHERE ma.id = ranked.id
  AND ranked.duplicate_rank > 1;

ALTER TABLE monthly_acceptances
        ADD CONSTRAINT uq_monthly_acceptances_contract_equipment_month
        UNIQUE (contract_id, equipment_id, billing_month);

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;

CREATE TRIGGER trg_audit_logs_append_only
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

