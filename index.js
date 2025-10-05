import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (req, res) => {
  res.send("🚀 Form Email API is running and CORS enabled!");
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
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS || !process.env.RECIPIENT_EMAIL) {
      throw new Error("Missing required environment variables: MAIL_USER, MAIL_PASS, or RECIPIENT_EMAIL");
    }

      let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        pool: false,
        maxConnections: 1,
        maxMessages: 1,
        requireTLS: true,
        debug: true,
        logger: true
      });

    console.log("🔍 Verifying Gmail connection...");
    
    try {
      await transporter.verify();
      console.log("✅ Gmail connection verified successfully");
    } catch (verifyError) {
      console.log("⚠️ Primary connection failed, trying alternative configuration...");
      
      // Alternative configuration for Railway
      const altTransporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 90000,
        greetingTimeout: 60000,
        socketTimeout: 90000,
        pool: false,
        maxConnections: 1,
        maxMessages: 1,
        requireTLS: false,
        debug: true,
        logger: true
      });
      
      await altTransporter.verify();
      console.log("✅ Alternative Gmail connection verified successfully");
      
      // Use the alternative transporter
      transporter = altTransporter;
    }
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

    console.log("📧 Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully from ${fullName}`, info.messageId);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("❌ Email Error Details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    let errorMessage = "Failed to send email.";
    if (error.code === 'EAUTH') {
      errorMessage = "Gmail authentication failed. Check your email credentials.";
    } else if (error.code === 'ECONNECTION') {
      errorMessage = "Could not connect to Gmail servers.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "Connection to Gmail timed out.";
    }
    
    res
      .status(500)
      .json({ 
        success: false, 
        message: errorMessage, 
        error: error.message,
        code: error.code 
      });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
