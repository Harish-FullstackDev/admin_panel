import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, text, html }) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: "support@workspace360.one",
        pass: "Pr_support360.one",
      },
    });

    const mailOptions = {
  from: `"My App" <support@workspace360.one>`, 
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}
