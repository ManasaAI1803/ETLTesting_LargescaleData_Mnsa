// Define a type for validation functions
type ValidationFn = (value: unknown) => boolean;

interface EntityRules {
  mandatoryFields: string[];
  acceptableValues?: Record<string, unknown[]>;
  validationRules: Record<string, ValidationFn>;
}

interface BusinessRules {
  patients: EntityRules;
  providers: EntityRules;
  visits: EntityRules;
  medications: EntityRules;
  billing: EntityRules;
}
export const businessRules = {
    patients: {
        mandatoryFields: ['patient_id', 'name', 'dob', 'gender'],
        acceptableValues: {
            gender: ['M', 'F', 'O']
        },
        validationRules: {
            patient_id: (value: any) => typeof value === 'number' && value > 0,
            name: (value: any) => typeof value === 'string' && value.trim() !== '',
            dob: (value: any) => !isNaN(new Date(value).getTime()),
            gender: (value: any) => ['M', 'F', 'O'].includes(value)
        }
    },
    providers: {
        mandatoryFields: ['provider_id', 'name', 'specialty'],
        validationRules: {
            provider_id: (value: any) => typeof value === 'number' && value > 0,
            name: (value: any) => typeof value === 'string' && value.trim() !== '',
            specialty: (value: any) => typeof value === 'string' && value.trim() !== ''
        }
    },
    visits: {
        mandatoryFields: ['visit_id', 'patient_id', 'provider_id', 'visit_date'],
        validationRules: {
            visit_id: (value: any) => typeof value === 'number' && value > 0,
            patient_id: (value: any) => typeof value === 'number' && value > 0,
            provider_id: (value: any) => typeof value === 'number' && value > 0,
            visit_date: (value: any) => !isNaN(new Date(value).getTime())
        }
    },
    medications: {
        mandatoryFields: ['medication_id', 'patient_id', 'name', 'dosage'],
        validationRules: {
            medication_id: (value: any) => typeof value === 'number' && value > 0,
            patient_id: (value: any) => typeof value === 'number' && value > 0,
            name: (value: any) => typeof value === 'string' && value.trim() !== '',
            dosage: (value: any) => typeof value === 'string' && value.trim() !== ''
        }
    },
    billing: {
        mandatoryFields: ['billing_id', 'visit_id', 'amount', 'date'],
        validationRules: {
            billing_id: (value: any) => typeof value === 'number' && value > 0,
            visit_id: (value: any) => typeof value === 'number' && value > 0,
            amount: (value: any) => typeof value === 'number' && value >= 0,
            date: (value: any) => !isNaN(new Date(value).getTime())
        }
    }
};