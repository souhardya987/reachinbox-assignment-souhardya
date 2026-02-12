"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scheduleController_1 = require("../controllers/scheduleController");
const router = express_1.default.Router();
router.post('/schedule-email', scheduleController_1.scheduleEmail);
router.get('/scheduled-emails', scheduleController_1.getScheduledEmails);
exports.default = router;
