"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'MOCK_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'MOCK_CLIENT_SECRET',
    callbackURL: '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
    // In a real app, find or create user in DB
    const user = {
        id: profile.id,
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos,
    };
    return done(null, user);
}));
exports.default = passport_1.default;
