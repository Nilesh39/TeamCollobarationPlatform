"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
(0, vitest_1.describe)('System API & Connectivity Integration Tests', () => {
    const app = (0, app_1.createApp)();
    (0, vitest_1.it)('GET / should return service info and endpoint list', async () => {
        const res = await (0, supertest_1.default)(app).get('/');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.service).toContain('AI WORK OS');
        (0, vitest_1.expect)(res.body.status).toBe('active');
    });
    (0, vitest_1.it)('GET /api/v1/health should respond with operational status', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/health');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.status).toBe('ok');
        (0, vitest_1.expect)(res.body.services).toBeDefined();
        (0, vitest_1.expect)(res.body.services.redis).toBeDefined();
        (0, vitest_1.expect)(res.body.services.database).toBeDefined();
    });
    (0, vitest_1.it)('Undefined route should return RFC-7807 404 Not Found problem details', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/unknown-endpoint');
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body.type).toContain('rfc7807');
        (0, vitest_1.expect)(res.body.status).toBe(404);
        (0, vitest_1.expect)(res.body.errorCode).toBe('NOT_FOUND');
        (0, vitest_1.expect)(res.body.path).toBe('/api/v1/unknown-endpoint');
    });
});
//# sourceMappingURL=db-connectivity.test.js.map