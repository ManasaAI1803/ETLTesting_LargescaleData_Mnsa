"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessRules = void 0;
exports.businessRules = {
    patients: {
        mandatoryFields: ['patient_id', 'name', 'dob', 'gender'],
        acceptableValues: {
            gender: ['M', 'F', 'O']
        },
        validationRules: {
            patient_id: (value) => typeof value === 'number' && value > 0,
            name: (value) => typeof value === 'string' && value.trim() !== '',
            dob: (value) => !isNaN(new Date(value).getTime()),
            gender: (value) => ['M', 'F', 'O'].includes(value)
        }
    },
    providers: {
        mandatoryFields: ['provider_id', 'name', 'specialty'],
        validationRules: {
            provider_id: (value) => typeof value === 'number' && value > 0,
            name: (value) => typeof value === 'string' && value.trim() !== '',
            specialty: (value) => typeof value === 'string' && value.trim() !== ''
        }
    },
    visits: {
        mandatoryFields: ['visit_id', 'patient_id', 'provider_id', 'visit_date'],
        validationRules: {
            visit_id: (value) => typeof value === 'number' && value > 0,
            patient_id: (value) => typeof value === 'number' && value > 0,
            provider_id: (value) => typeof value === 'number' && value > 0,
            visit_date: (value) => !isNaN(new Date(value).getTime())
        }
    },
    medications: {
        mandatoryFields: ['medication_id', 'patient_id', 'name', 'dosage'],
        validationRules: {
            medication_id: (value) => typeof value === 'number' && value > 0,
            patient_id: (value) => typeof value === 'number' && value > 0,
            name: (value) => typeof value === 'string' && value.trim() !== '',
            dosage: (value) => typeof value === 'string' && value.trim() !== ''
        }
    },
    billing: {
        mandatoryFields: ['billing_id', 'visit_id', 'amount', 'date'],
        validationRules: {
            billing_id: (value) => typeof value === 'number' && value > 0,
            visit_id: (value) => typeof value === 'number' && value > 0,
            amount: (value) => typeof value === 'number' && value >= 0,
            date: (value) => !isNaN(new Date(value).getTime())
        }
    }
};
