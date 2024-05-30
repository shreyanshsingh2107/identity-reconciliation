"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const identifyController_1 = require("../controllers/identifyController");
const router = express_1.default.Router();
router.post('/identify', identifyController_1.identifyContact);
exports.default = router;
