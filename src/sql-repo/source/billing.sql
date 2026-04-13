SELECT 
    b.billing_id, 
    b.patient_id, 
    b.provider_id, 
    b.visit_id, 
    b.amount, 
    b.date 
FROM 
    billing b 
WHERE 
    b.amount IS NULL 
    OR b.date IS NULL 
    OR b.patient_id IS NULL 
    OR b.provider_id IS NULL 
    OR b.visit_id IS NULL;