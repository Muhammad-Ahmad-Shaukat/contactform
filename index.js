import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const resend = new Resend(process.env.RESEND_API_KEY);

app.get("/", (req, res) => {
  res.send("🚀 Email API is running successfully on Railway!");
});

app.post("/send", async (req, res) => {
  const {
    pickupDate,
    pickupTime,
    pickupLocation,
    dropoffLocation,
    fullName,
    phone,
    email,
    passengers,
  } = req.body;

  if (
    !pickupDate ||
    !pickupTime ||
    !pickupLocation ||
    !dropoffLocation ||
    !fullName ||
    !phone ||
    !email
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields." });
  }

  try {
    const response = await resend.emails.send({
      from: "Quote Form <onboarding@resend.dev>",
      to: process.env.RECIPIENT_EMAIL,
      subject: `New Quote Request from ${fullName}`,
      html: `
        <h2>New Quote Submission</h2>
        <p><b>Pick-Up Date:</b> ${pickupDate}</p>
        <p><b>Pick-Up Time:</b> ${pickupTime}</p>
        <p><b>Pick-Up Location:</b> ${pickupLocation}</p>
        <p><b>Drop-Off Location:</b> ${dropoffLocation}</p>
        <p><b>Full Name:</b> ${fullName}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Passengers:</b> ${passengers || "N/A"}</p>
      `,
    });

    console.log("✅ Email sent:", response);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send email.", error });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
