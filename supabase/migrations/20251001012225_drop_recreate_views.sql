BEGIN;

-- Drop the old views (force drop with CASCADE to kill the definer metadata)
DROP VIEW IF EXISTS public.v_flow_headline CASCADE;
DROP VIEW IF EXISTS public.v_flow_totals_twd CASCADE;
DROP VIEW IF EXISTS public.v_edge_recurring_flow CASCADE;
DROP VIEW IF EXISTS public.v_edge_entry_twd CASCADE;

-- Recreate clean views (no SECURITY DEFINER)

CREATE OR REPLACE VIEW public.v_edge_entry_twd AS
SELECT 
    id,
    edge_id,
    entry_date,
    COALESCE(original_amount, amount) AS amount_src,
    original_currency AS currency_src,
    fx_convert(
        COALESCE(original_amount, amount),
        original_currency,
        'TWD'::text,
        entry_date,
        'USD'::text
    ) AS amount_twd
FROM edge_entries ee;

CREATE OR REPLACE VIEW public.v_edge_recurring_flow AS
WITH base AS (
    SELECT 
        ee.edge_id,
        SUM(CASE WHEN e.type = 'Fuel'::text THEN -ee.amount_twd ELSE ee.amount_twd END) AS daily_flow,
        SUM(CASE WHEN e.type = 'Fuel'::text THEN -ee.amount_twd ELSE ee.amount_twd END) * 30::numeric AS monthly_flow,
        SUM(CASE WHEN e.type = 'Fuel'::text THEN -ee.amount_twd ELSE ee.amount_twd END) * 365::numeric AS yearly_flow,
        COUNT(*) AS entries_count
    FROM v_edge_entry_twd ee
    JOIN edges e ON e.id = ee.edge_id
    GROUP BY ee.edge_id
)
SELECT * FROM base;

CREATE OR REPLACE VIEW public.v_flow_totals_twd AS
SELECT 
    e.flow_id,
    SUM(v.daily_flow)   AS daily_total,
    SUM(v.monthly_flow) AS monthly_total,
    SUM(v.yearly_flow)  AS yearly_total
FROM edges e
JOIN v_edge_recurring_flow v ON e.id = v.edge_id
GROUP BY e.flow_id;

CREATE OR REPLACE VIEW public.v_flow_headline AS
SELECT 
    e.flow_id,
    COALESCE(SUM(er.daily_flow),   0::numeric) AS daily_total,
    COALESCE(SUM(er.monthly_flow), 0::numeric) AS monthly_total,
    COALESCE(SUM(er.yearly_flow),  0::numeric) AS yearly_total
FROM edges e
JOIN v_edge_recurring_flow er ON er.edge_id = e.id
GROUP BY e.flow_id;

COMMIT;
