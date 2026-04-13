SELECT 
    v.visit_id,
    v.patient_id,
    v.provider_id,
    v.visit_date,
    v.visit_type,
    v.notes
FROM 
    visits v
WHERE 
    v.visit_date IS NULL 
    OR v.patient_id IS NULL 
    OR v.provider_id IS NULL 
    OR v.visit_type NOT IN ('Routine', 'Emergency', 'Follow-up');