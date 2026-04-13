SELECT 
    m.medication_id, 
    m.patient_id, 
    m.provider_id, 
    m.medication_name, 
    m.dosage, 
    m.start_date, 
    m.end_date 
FROM 
    medications m 
WHERE 
    m.start_date IS NULL 
    OR m.end_date IS NULL 
    OR m.medication_name IS NULL 
    OR m.dosage IS NULL;