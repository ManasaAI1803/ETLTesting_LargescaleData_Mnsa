"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const connection_1 = require("../db/connection");
const repository_1 = require("../db/repository");
const anomalyReport_1 = require("../reporters/anomalyReport");
const patientsValidator_1 = require("../validators/patientsValidator");
const providersValidator_1 = require("../validators/providersValidator");
const visitsValidator_1 = require("../validators/visitsValidator");
const medicationsValidator_1 = require("../validators/medicationsValidator");
const billingValidator_1 = require("../validators/billingValidator");
const dbConnection = new connection_1.DatabaseConnection();
const repository = new repository_1.Repository(dbConnection);
const anomalyReport = new anomalyReport_1.AnomalyReport();
const validators = {
    patients: new patientsValidator_1.PatientsValidator(),
    providers: new providersValidator_1.ProvidersValidator(),
    visits: new visitsValidator_1.VisitsValidator(),
    medications: new medicationsValidator_1.MedicationsValidator(),
    billing: new billingValidator_1.BillingValidator(),
};
test_1.test.beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield dbConnection.connect();
}));
test_1.test.afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield dbConnection.disconnect();
}));
// Add test cases for validation here using the validators and anomalyReport as needed.
