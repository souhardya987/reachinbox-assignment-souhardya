import express from 'express';
import { scheduleEmail, getScheduledEmails, getSentEmails, getEmailCounts, deleteEmail } from '../controllers/scheduleController';

const router = express.Router();

router.post('/schedule-email', scheduleEmail);
router.get('/scheduled-emails', getScheduledEmails);
router.get('/sent-emails', getSentEmails);
router.get('/email-counts', getEmailCounts);
router.delete('/scheduled-emails/:id', deleteEmail);

export default router;
