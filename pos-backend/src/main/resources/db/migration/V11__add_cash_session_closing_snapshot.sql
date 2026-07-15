ALTER TABLE cash_sessions
    ADD COLUMN total_inflows NUMERIC(12, 2),
    ADD COLUMN total_outflows NUMERIC(12, 2),
    ADD COLUMN cash_sales_amount NUMERIC(12, 2),
    ADD COLUMN credit_sales_amount NUMERIC(12, 2),
    ADD COLUMN receivable_payments_amount NUMERIC(12, 2),
    ADD COLUMN manual_inflows_amount NUMERIC(12, 2),
    ADD COLUMN manual_outflows_amount NUMERIC(12, 2),
    ADD COLUMN sale_refunds_amount NUMERIC(12, 2),
    ADD COLUMN sale_cancellation_refunds_amount NUMERIC(12, 2),
    ADD COLUMN returns_processed_amount NUMERIC(12, 2),
    ADD COLUMN cancellations_processed_amount NUMERIC(12, 2),
    ADD COLUMN closing_notes VARCHAR(255);

ALTER TABLE cash_sessions
    DROP CONSTRAINT chk_cash_sessions_open_fields;

ALTER TABLE cash_sessions
    ADD CONSTRAINT chk_cash_sessions_total_inflows_non_negative
        CHECK (total_inflows IS NULL OR total_inflows >= 0),
    ADD CONSTRAINT chk_cash_sessions_total_outflows_non_negative
        CHECK (total_outflows IS NULL OR total_outflows >= 0),
    ADD CONSTRAINT chk_cash_sessions_cash_sales_amount_non_negative
        CHECK (cash_sales_amount IS NULL OR cash_sales_amount >= 0),
    ADD CONSTRAINT chk_cash_sessions_credit_sales_amount_non_negative
        CHECK (credit_sales_amount IS NULL OR credit_sales_amount >= 0),
    ADD CONSTRAINT chk_cash_sessions_receivable_payments_amount_non_negative
        CHECK (receivable_payments_amount IS NULL OR receivable_payments_amount >= 0),
    ADD CONSTRAINT chk_cash_sessions_manual_inflows_amount_non_negative
        CHECK (manual_inflows_amount IS NULL OR manual_inflows_amount >= 0),
    ADD CONSTRAINT chk_cash_sessions_manual_outflows_amount_non_negative
        CHECK (manual_outflows_amount IS NULL OR manual_outflows_amount >= 0),
    ADD CONSTRAINT chk_cash_sessions_sale_refunds_amount_non_negative
        CHECK (sale_refunds_amount IS NULL OR sale_refunds_amount >= 0),
    ADD CONSTRAINT chk_cash_sessions_sale_cancellation_refunds_amount_non_negative
        CHECK (sale_cancellation_refunds_amount IS NULL OR sale_cancellation_refunds_amount >= 0),
    ADD CONSTRAINT chk_cash_sessions_returns_processed_amount_non_negative
        CHECK (returns_processed_amount IS NULL OR returns_processed_amount >= 0),
    ADD CONSTRAINT chk_cash_sessions_cancellations_processed_amount_non_negative
        CHECK (cancellations_processed_amount IS NULL OR cancellations_processed_amount >= 0),
    ADD CONSTRAINT chk_cash_sessions_closing_notes_length
        CHECK (closing_notes IS NULL OR length(closing_notes) <= 255),
    ADD CONSTRAINT chk_cash_sessions_open_fields
        CHECK (
            status <> 'OPEN'
            OR (
                closed_by_user_id IS NULL
                AND closed_at IS NULL
                AND expected_cash IS NULL
                AND counted_cash IS NULL
                AND cash_difference IS NULL
                AND total_inflows IS NULL
                AND total_outflows IS NULL
                AND cash_sales_amount IS NULL
                AND credit_sales_amount IS NULL
                AND receivable_payments_amount IS NULL
                AND manual_inflows_amount IS NULL
                AND manual_outflows_amount IS NULL
                AND sale_refunds_amount IS NULL
                AND sale_cancellation_refunds_amount IS NULL
                AND returns_processed_amount IS NULL
                AND cancellations_processed_amount IS NULL
                AND closing_notes IS NULL
            )
        ),
    ADD CONSTRAINT chk_cash_sessions_closed_fields
        CHECK (
            status <> 'CLOSED'
            OR (
                closed_by_user_id IS NOT NULL
                AND closed_at IS NOT NULL
                AND expected_cash IS NOT NULL
                AND counted_cash IS NOT NULL
                AND cash_difference IS NOT NULL
                AND total_inflows IS NOT NULL
                AND total_outflows IS NOT NULL
                AND cash_sales_amount IS NOT NULL
                AND credit_sales_amount IS NOT NULL
                AND receivable_payments_amount IS NOT NULL
                AND manual_inflows_amount IS NOT NULL
                AND manual_outflows_amount IS NOT NULL
                AND sale_refunds_amount IS NOT NULL
                AND sale_cancellation_refunds_amount IS NOT NULL
                AND returns_processed_amount IS NOT NULL
                AND cancellations_processed_amount IS NOT NULL
            )
        );

CREATE INDEX idx_cash_sessions_closed_by_user_id ON cash_sessions (closed_by_user_id);
CREATE INDEX idx_cash_sessions_closed_at ON cash_sessions (closed_at);
