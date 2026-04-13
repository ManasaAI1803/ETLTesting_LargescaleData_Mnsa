<<<<<<< HEAD
# Healthcare Data Validation Framework

## Overview
This project implements a healthcare data validation framework that ensures the integrity and accuracy of data across various tables in a healthcare database. The framework validates data from source and target datasets against specified business rules and generates readable anomaly reports.

## Project Structure
```
healthcare-data-validation
├── src
│   ├── index.ts                  # Entry point for the application
│   ├── db
│   │   ├── connection.ts         # Manages database connection
│   │   └── repository.ts         # Provides access to source and target datasets
│   ├── sql-repo
│   │   ├── source
│   │   │   ├── patients.sql      # Query to retrieve patient data from source
│   │   │   ├── providers.sql     # Query to retrieve provider data from source
│   │   │   ├── visits.sql        # Query to retrieve visit data from source
│   │   │   ├── medications.sql    # Query to retrieve medication data from source
│   │   │   └── billing.sql       # Query to retrieve billing data from source
│   │   └── target
│   │       ├── patients.sql      # Query to retrieve patient data from target
│   │       ├── providers.sql     # Query to retrieve provider data from target
│   │       ├── visits.sql        # Query to retrieve visit data from target
│   │       ├── medications.sql    # Query to retrieve medication data from target
│   │       └── billing.sql       # Query to retrieve billing data from target
│   ├── validators
│   │   ├── patientsValidator.ts   # Validation methods for Patients table
│   │   ├── providersValidator.ts  # Validation methods for Providers table
│   │   ├── visitsValidator.ts     # Validation methods for Visits table
│   │   ├── medicationsValidator.ts # Validation methods for Medications table
│   │   └── billingValidator.ts    # Validation methods for Billing table
│   ├── rules
│   │   └── businessRules.ts      # Defines business rules for validation
│   ├── reporters
│   │   └── anomalyReport.ts      # Generates reports of validation anomalies
│   └── automation
│       ├── playwright
│       │   ├── tests
│       │   │   └── validation.spec.ts # Playwright test cases for validation
│       │   └── helpers
│       │       └── playwrightHelpers.ts # Helper functions for Playwright tests
│       └── imports.ts            # Imports necessary modules for automation
├── sql
│   └── migrations
│       └── README.md             # Documentation for database migrations
├── tests
│   ├── unit
│   │   └── validators.test.ts     # Unit tests for validators
│   └── e2e
│       └── automation.test.ts     # End-to-end tests for validation framework
├── playwright.config.ts           # Configuration for Playwright
├── package.json                   # npm configuration file
├── tsconfig.json                  # TypeScript configuration file
├── .env.example                   # Example environment configuration
└── README.md                      # Project documentation
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd healthcare-data-validation
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the database connection by updating the `.env` file based on the `.env.example` template.

4. Run the validation framework:
   ```
   npm start
   ```

5. Execute Playwright tests:
   ```
   npm run test:playwright
   ```

## Usage
The framework will automatically validate the specified tables (Patients, Providers, Visits, Medications, Billing) against the defined business rules. An anomaly report will be generated, detailing any validation issues found.

## Contribution Guidelines
Contributions are welcome! Please submit a pull request with a description of your changes. Ensure that all tests pass before submitting.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
=======
# ETLTesting_LargescaleData_Mnsa
>>>>>>> d74472cd8a64021643b2a594c09a6fa43309f354
