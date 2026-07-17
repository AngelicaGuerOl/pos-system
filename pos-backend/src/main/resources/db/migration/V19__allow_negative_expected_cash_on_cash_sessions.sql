ALTER TABLE cash_sessions
    DROP CONSTRAINT IF EXISTS chk_cash_sessions_expected_cash_non_negative;
