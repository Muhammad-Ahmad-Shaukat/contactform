import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();

// ===== Middleware =====
app.use(express.json());
app.use(
  cors({
    origin: "*", // allow all origins (fine for testing)
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ===== Health Check =====
app.get("/", (req, res) => {
  res.send("🚀 Form Email API is running and CORS enabled!");
});

// ===== Email Handler =====
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

  // Validation
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
    // Nodemailer config with better timeout and connection settings
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
      rateDelta: 20000,
      rateLimit: 5
    });

    // Verify connection configuration
    await transporter.verify();

    const mailOptions = {
      from: `"Quote Form" <${process.env.MAIL_USER}>`,
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
        <p><b>Passengers:</b> ${passengers}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully from ${fullName}`);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("❌ Email Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send email.", error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
