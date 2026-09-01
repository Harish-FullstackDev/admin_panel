import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const data = await req.json();
    const payload = data?.payload;

    const name = payload?.invitee?.name;
    const email = payload?.invitee?.email;
    const eventStart = payload?.event?.start_time;
    const eventType = payload?.event_type?.name;

    // Log to console
    console.log("📅 New Calendly Booking:", { name, email, eventStart, eventType });

    // Send Email Notification
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NOTIFY_EMAIL,
        pass: process.env.NOTIFY_EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Calendly Bot" <${process.env.NOTIFY_EMAIL}>`,
      to: "pdhanoosh@isupportz.com",
      subject: "New Demo Scheduled via Calendly",
      html: `
        <div style="font-family:sans-serif;line-height:1.5">
          <h2>New Demo Scheduled</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Event Type:</strong> ${eventType}</p>
          <p><strong>Time:</strong> ${eventStart}</p>
          <p>Check your Calendly dashboard for full details.</p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
