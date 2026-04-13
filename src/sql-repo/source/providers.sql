SELECT 
    provider_id, 
    provider_name, 
    specialty, 
    contact_info 
FROM 
    providers 
WHERE 
    is_active = 1;