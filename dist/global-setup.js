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
const queryStore_1 = require("./queryStore");
const reportStateStore_1 = require("./reporters/reportStateStore");
function globalSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('📦 Global setup: resetting shared report state and query log');
        reportStateStore_1.ReportStateStore.clearState();
        const queryStore = queryStore_1.QueryStore.getInstance();
        queryStore.clear();
    });
}
exports.default = globalSetup;
