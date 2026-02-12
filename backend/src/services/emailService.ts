import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const createTransporter = async () => {
    // Use Ethereal for testing
    // If credentials are provided in .env, use them. Otherwise create a test account.
    let user = process.env.ETHEREAL_USER;
    let pass = process.env.ETHEREAL_PASS;

    if (!user || !pass) {
        const testAccount = await nodemailer.createTestAccount();
        user = testAccount.user;
        pass = testAccount.pass;
        console.log('Ethereal Test Account created:', user);
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: user,
            pass: pass,
        },
    });

    return transporter;
};

export const sendEmail = async (to: string, subject: string, html: string, from?: string) => {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
        from: from || '"ReachInbox Scheduler" <scheduler@reachinbox.com>', // Use provided from or default
        to: to, // list of receivers
        subject: subject, // Subject line
        html: html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return info;
};
