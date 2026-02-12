import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import path from 'path';

// Robust .env loading
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
    console.error('CRITICAL: GOOGLE_CLIENT_ID is missing or invalid in .env!');
} else {
    console.log('Google Auth Configured with Client ID:', GOOGLE_CLIENT_ID.substring(0, 15) + '...');
}

passport.serializeUser((user: any, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID || 'MISSING_CLIENT_ID',
            clientSecret: GOOGLE_CLIENT_SECRET || 'MISSING_CLIENT_SECRET',
            callbackURL: 'http://localhost:3000/auth/google/callback',
        },
        (accessToken, refreshToken, profile, done) => {
            // Simplify user object for session (cookie size limits)
            const user = {
                id: profile.id,
                displayName: profile.displayName,
                email: profile.emails?.[0]?.value,
                photo: profile.photos?.[0]?.value,
            };
            return done(null, user);
        }
    )
);

export default passport;
