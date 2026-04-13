SELECT 
    patient_id, 
    first_name, 
    last_name, 
    date_of_birth, 
    gender, 
    address, 
    phone_number 
FROM 
    patients 
WHERE 
    is_active = 1;