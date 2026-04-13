SELECT 
    b.billing_id,
    b.patient_id,
    b.provider_id,
    b.amount,
    b.date,
    b.status
FROM 
    target.billing b
WHERE 
    b.amount < 0 OR 
    b.status NOT IN ('Paid', 'Pending', 'Denied') OR 
    b.date IS NULL;