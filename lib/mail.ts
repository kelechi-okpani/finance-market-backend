/**
 * Mail Utility
 * Simulated for now. In a production environment, you would integrate 
 * with a service like Nodemailer, Resend, or SendGrid.
 */

export async function sendKYCLinkEmail(email: string, firstName: string) {
    const frontendUrl = process.env.FRONTEND_URL || "https://stock-portfolio-ruby-five.vercel.app";
    const kycLink = `${frontendUrl}/onboarding`;

    console.log("-----------------------------------------");
    console.log(`[MAILER] Sending KYC Link to: ${email}`);
    console.log(`Subject: Your Account Request is Approved!`);
    console.log(`Body:`);
    console.log(`Hi ${firstName},`);
    console.log(`Congratulations! Your account request for VaultStock has been approved.`);
    console.log(`To finish setting up your account and access your dashboard, please complete your KYC onboarding at the following link:`);
    console.log(`${kycLink}`);
    console.log(`Note: You will set your password during this process.`);
    console.log("-----------------------------------------");

    return { success: true, message: "Email simulation successful." };
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || "https://stock-portfolio-ruby-five.vercel.app";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    console.log("-----------------------------------------");
    console.log(`[MAILER] Sending Password Reset to: ${email}`);
    console.log(`Subject: Reset Your VaultStock Password`);
    console.log(`Body:`);
    console.log(`You requested a password reset for your VaultStock account.`);
    console.log(`Click the link below to set a new password:`);
    console.log(`${resetLink}`);
    console.log(`This link will expire in 1 hour.`);
    console.log("-----------------------------------------");

    return { success: true, message: "Reset email simulation successful." };
}
