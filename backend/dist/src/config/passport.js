"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Robust .env loading
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
    console.error('CRITICAL: GOOGLE_CLIENT_ID is missing or invalid in .env!');
}
else {
    console.log('Google Auth Configured with Client ID:', GOOGLE_CLIENT_ID.substring(0, 15) + '...');
}
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_CLIENT_ID || 'MISSING_CLIENT_ID',
    clientSecret: GOOGLE_CLIENT_SECRET || 'MISSING_CLIENT_SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
    var _a, _b, _c, _d;
    // Simplify user object for session (cookie size limits)
    const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
        photo: (_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
    };
    return done(null, user);
}));
exports.default = passport_1.default;
