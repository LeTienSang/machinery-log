-- Migration V3: cho phep upload chua gan hop dong / thiet bi / ngay lam.
-- Accountant bo sung sau o Review UI truoc khi duyet.
ALTER TABLE daily_logs ALTER COLUMN contract_id DROP NOT NULL;
ALTER TABLE daily_logs ALTER COLUMN equipment_id DROP NOT NULL;
ALTER TABLE daily_logs ALTER COLUMN work_date DROP NOT NULL;
