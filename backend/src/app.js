const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
console.log('✅ Environment variables loaded');
const compression = require("compression");
const pool = require("./config/db");


const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const leadsRoutes = require("./routes/leadsRoutes");
const exportRoutes = require("./routes/exportRoutes");
const bulkUploadRoutes = require("./routes/bulkUploadRoutes");
const courseRoutes = require("./routes/courseRoutes");
const subCourseRoutes = require("./routes/subCourseRoutes");
const filterRoutes = require("./routes/filterRoutes");
const commentRoutes = require("./routes/commentRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const assigneeRoutes = require("./routes/assigneeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/usersRoutes");
const metaRoutes = require("./routes/metaRoutes");
const metaLeadsRoutes = require("./routes/metaLeadsRoutes");
const attendanceRoutes = require("./routes/attendance");
const leaveRoutes = require("./routes/leave");
const holidayRoutes = require("./routes/holiday");
const settingsRoutes = require('./routes/settings');
const reviewsRoutes = require('./routes/reviews/reviewsRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const itUpdatesRoutes = require('./routes/itUpdatesRoutes');



const app = express();

// Middleware
app.use(compression());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// 🕵️ GLOBAL REQUEST LOGGER (Helping to debug 404 errors)
app.use((req, res, next) => {
  if (req.url !== '/favicon.ico') {
    console.log(`\n📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Root Route (Saves you from 404 error on ngrok link)
app.get("/", (req, res) => {
  res.send("<h1>Zen CRM API is Running</h1><p>Webhook is active at /api/meta-leads/webhook</p>");
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "https://zen.urbancode.in",
  "https://www.zen.urbancode.in",
  "https://zen-urbancode.in",
  "https://www.zen-urbancode.in",

];
const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is allowed or is a chrome extension (often used by testing tools like ReqBin)
    if (allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Routes
app.use("/bulk-upload-service", bulkUploadRoutes);
app.use("/auth", authRoutes);
app.use("/api", paymentRoutes);
app.use("/exportLeads", exportRoutes);
// app.use("/api/bulk-leads-upload", bulkUploadRoutes); // Removed old path
app.use("/leads", leadsRoutes);
app.use("/courses", courseRoutes);
app.use("/api/sub-courses", subCourseRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/", filterRoutes);
app.use("/", commentRoutes);
app.use("/api/assignees", assigneeRoutes);
app.use("/api", userRoutes);
app.use("/api/meta-campaigns", metaRoutes);
app.use("/api/meta-leads", metaLeadsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/it-updates", itUpdatesRoutes);

module.exports = app;
