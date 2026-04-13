import { businessRules } from './rules/businessRules';

export class MockDataGenerator {
    static generatePatients(count: number = 10, includeInvalid: boolean = false) {
        const patients = [];
        for (let i = 1; i <= count; i++) {
            patients.push({
                patient_id: i,
                name: `Patient ${i}`,
                dob: new Date(1980 + (i % 20), i % 12, i % 28 + 1).toISOString().split('T')[0],
                gender: businessRules.patients.acceptableValues.gender[i % 3],
            });
        }

        // Add invalid records for negative testing
        if (includeInvalid) {
            patients.push({
                patient_id: count + 1,
                name: '', // Invalid: empty name
                dob: 'invalid-date', // Invalid: bad date
                gender: 'X', // Invalid: not in acceptable values
            });
            patients.push({
                patient_id: count + 2,
                name: 'Invalid Patient',
                dob: '1990-01-01',
                gender: 'M',
                // Missing some fields for schema testing
            });
        }

        return patients;
    }

    static generateProviders(count: number = 5, includeInvalid: boolean = false) {
        const specialties = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology'];
        const providers = [];
        for (let i = 1; i <= count; i++) {
            providers.push({
                provider_id: i,
                name: `Dr. Provider ${i}`,
                specialty: specialties[i % specialties.length],
            });
        }

        if (includeInvalid) {
            providers.push({
                provider_id: count + 1,
                name: '', // Invalid: empty name
                specialty: 'Invalid Specialty',
            });
        }

        return providers;
    }

    static generateVisits(count: number = 20, includeInvalid: boolean = false) {
        const visits = [];
        for (let i = 1; i <= count; i++) {
            visits.push({
                visit_id: i,
                patient_id: (i % 10) + 1,
                provider_id: (i % 5) + 1,
                visit_date: new Date(2023, i % 12, i % 28 + 1).toISOString().split('T')[0],
            });
        }

        if (includeInvalid) {
            visits.push({
                visit_id: count + 1,
                patient_id: 999, // Invalid: non-existent patient
                provider_id: 1,
                visit_date: '2023-01-01',
            });
            visits.push({
                visit_id: count + 2,
                patient_id: 1,
                provider_id: 999, // Invalid: non-existent provider
                visit_date: 'invalid-date', // Invalid: bad date
            });
        }

        return visits;
    }

    static generateMedications(count: number = 15, includeInvalid: boolean = false) {
        const medications = [];
        for (let i = 1; i <= count; i++) {
            medications.push({
                medication_id: i,
                patient_id: (i % 10) + 1,
                name: `Medication ${i}`,
                dosage: `${i * 10}mg`,
            });
        }

        if (includeInvalid) {
            medications.push({
                medication_id: count + 1,
                patient_id: 999, // Invalid: non-existent patient
                name: '', // Invalid: empty name
                dosage: null, // Invalid: null dosage
            });
        }

        return medications;
    }

    static generateBilling(count: number = 20, includeInvalid: boolean = false) {
        const billing = [];
        for (let i = 1; i <= count; i++) {
            billing.push({
                billing_id: i,
                visit_id: i,
                amount: Math.floor(Math.random() * 500) + 50,
                date: new Date(2023, i % 12, i % 28 + 1).toISOString().split('T')[0],
            });
        }

        if (includeInvalid) {
            billing.push({
                billing_id: count + 1,
                visit_id: 999, // Invalid: non-existent visit
                amount: -100, // Invalid: negative amount
                date: '2023-01-01',
            });
            billing.push({
                billing_id: count + 2,
                visit_id: 1,
                amount: null, // Invalid: null amount
                date: 'invalid-date', // Invalid: bad date
            });
        }

        return billing;
    }
}