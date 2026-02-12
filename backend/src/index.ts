import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';
import passport from './config/passport';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // Trust first proxy (Render)

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite Frontend URL
    credentials: true,
}));

app.use(express.json());

app.use(
    cookieSession({
        name: 'session',
        keys: [process.env.SESSION_SECRET || 'secret'],
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: true, // Required for cross-site cookies (Render -> Vercel)
        sameSite: 'none', // Required for cross-site cookies
        httpOnly: true,
    })
);

// Register regenerate & save after the cookieSession middleware initialization
app.use((req: any, res, next) => {
    if (req.session && !req.session.regenerate) {
        req.session.regenerate = (cb: any) => {
            cb();
        };
    }
    if (req.session && !req.session.save) {
        req.session.save = (cb: any) => {
            cb();
        };
    }
    next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('ReachInbox Scheduler API is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    import('./worker'); // Start worker
});
