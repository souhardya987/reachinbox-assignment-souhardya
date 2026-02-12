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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.createTransporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const createTransporter = () => __awaiter(void 0, void 0, void 0, function* () {
    // Use Ethereal for testing
    // If credentials are provided in .env, use them. Otherwise create a test account.
    let user = process.env.ETHEREAL_USER;
    let pass = process.env.ETHEREAL_PASS;
    if (!user || !pass) {
        const testAccount = yield nodemailer_1.default.createTestAccount();
        user = testAccount.user;
        pass = testAccount.pass;
        console.log('Ethereal Test Account created:', user);
    }
    const transporter = nodemailer_1.default.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: user,
            pass: pass,
        },
    });
    return transporter;
});
exports.createTransporter = createTransporter;
const sendEmail = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = yield (0, exports.createTransporter)();
    const info = yield transporter.sendMail({
        from: '"ReachInbox Scheduler" <scheduler@reachinbox.com>', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        html: html, // html body
    });
    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer_1.default.getTestMessageUrl(info));
    return info;
});
exports.sendEmail = sendEmail;
