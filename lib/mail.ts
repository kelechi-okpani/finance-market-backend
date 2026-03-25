import nodemailer from 'nodemailer';

/**
 * Mail Utility using Nodemailer
 * Configuration is pulled from environment variables.
 */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const DEFAULT_FROM = process.env.SMTP_FROM || '"VaultStock" <no-reply@vaultstock.io>';

export async function sendKYCLinkEmail(email: string, firstName: string) {
    const frontendUrl = process.env.FRONTEND_URL || "https://stock-portfolio-ruby-five.vercel.app";
    const kycLink = `${frontendUrl}/onboarding`;

    const mailOptions = {
        from: DEFAULT_FROM,
        to: email,
        subject: 'Your Account Request is Approved!',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h2>Hi ${firstName},</h2>
                <p>Congratulations! Your account request for VaultStock has been approved.</p>
                <p>To finish setting up your account and access your dashboard, please complete your KYC onboarding at the link below:</p>
                <a href="${kycLink}" style="display: block; width: fit-content; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Complete Onboarding</a>
                <p>Note: You will set your password during this process.</p>
                <p>If the button doesn't work, copy and paste this link: <br> ${kycLink}</p>
            </div>
        `,
    };

    try {
        if (!process.env.SMTP_HOST) {
            console.log("-----------------------------------------");
            console.log(`[SIMULATION] KYC Email to: ${email}`);
            console.log(`Link: ${kycLink}`);
            console.log("-----------------------------------------");
            return { success: true, message: "Simulation successful." };
        }

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error("Mail Send Error (KYC):", error);
        return { success: false, error };
    }
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || "https://stock-portfolio-ruby-five.vercel.app";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
        from: DEFAULT_FROM,
        to: email,
        subject: 'Reset Your VaultStock Password',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h2>Reset Your Password</h2>
                <p>You requested a password reset for your VaultStock account.</p>
                <p>Click the button below to set a new password:</p>
                <a href="${resetLink}" style="display: block; width: fit-content; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>If the button doesn't work, copy and paste this link: <br> ${resetLink}</p>
            </div>
        `,
    };

    try {
        if (!process.env.SMTP_HOST) {
            console.log("-----------------------------------------");
            console.log(`[SIMULATION] Reset Email to: ${email}`);
            console.log(`Link: ${resetLink}`);
            console.log("-----------------------------------------");
            return { success: true, message: "Simulation successful." };
        }

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error("Mail Send Error (Reset):", error);
        return { success: false, error };
    }
}

export async function sendOTPEmail(email: string, otp: string) {
    const mailOptions = {
        from: DEFAULT_FROM,
        to: email,
        subject: 'Verify Your Email — VaultStock',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h2>Email Verification</h2>
                <p>Use the following One-Time Password (OTP) to verify your email address. This code will expire in 10 minutes.</p>
                <div style="font-size: 32px; font-weight: bold; padding: 20px; background: #f4f4f4; text-align: center; border-radius: 10px; color: #0070f3; letter-spacing: 5px;">
                    ${otp}
                </div>
                <p>If you did not request this code, please ignore this email.</p>
            </div>
        `,
    };

    try {
        if (!process.env.SMTP_HOST) {
            console.log("-----------------------------------------");
            console.log(`[SIMULATION] OTP Email to: ${email}`);
            console.log(`OTP: ${otp}`);
            console.log("-----------------------------------------");
            return { success: true, message: "Simulation successful." };
        }

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error("Mail Send Error (OTP):", error);
        return { success: false, error };
    }
}

export async function sendAccountAcknowledgmentEmail(email: string, firstName: string) {
    const mailOptions = {
        from: DEFAULT_FROM,
        to: email,
        subject: 'Account Request Received — VaultStock',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                <h2 style="color: #333;">Hello ${firstName},</h2>
                <p>Thank you for requesting an account with <strong>VaultStock</strong>.</p>
                <p>We have received your request and our team is currently reviewing it. You will receive another email as soon as your account is approved with instructions on how to complete your setup.</p>
                <p>If you have any questions in the meantime, please feel free to reach out to our support team.</p>
                <br />
                <p>Best regards,<br />The VaultStock Team</p>
            </div>
        `,
    };

    try {
        if (!process.env.SMTP_HOST) {
            console.log("-----------------------------------------");
            console.log(`[SIMULATION] Acknowledgment Email to: ${email}`);
            console.log("-----------------------------------------");
            return { success: true, message: "Simulation successful." };
        }

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error("Mail Send Error (Acknowledgment):", error);
        return { success: false, error };
    }
}
