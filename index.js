const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const logger = require("./src/service/logger.service.js");
const MainRoutes = require("./src/routes/routeManager.js");
const {
  updateFdData,
  updateGoldData,
  updateRealEstateData,
} = require("./src/cronJobs/cron.js");
const seedDatabase = require("./src/seeder/seeds.js");

dotenv.config();

// Initialize Express app
const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || "localhost";
const DB_CONNECTION = process.env.CONNECTION;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const corsOptions = {
  origin: "http://148.72.246.221:81/deskledger/app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ids"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
MainRoutes.forEach((route) => {
  app.use("/", route);
});

// Image endpoint
app.get("/image/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, "uploads", filename);

  fs.access(filepath, fs.constants.F_OK, (err) => {
    if (err) {
      logger.error(`File not found: ${filename}`);
      return res.status(404).send("File not found");
    }
    res.sendFile(filepath);
  });
});

// Database connection
const databaseConnection = async () => {
  try {
    await mongoose.connect(DB_CONNECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info("Connected to the database.");
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Run Seeder on Startup
const runSeeder = async () => {
  try {
    logger.info("Starting database seeding...");
    await seedDatabase();
    logger.info("Database seeding completed.");
  } catch (error) {
    logger.error(`Error during seeding: ${error.message}`);
  }
};

// Cron job
cron.schedule("0 0 * * *", async () => {
  try {
    logger.info("Cron job running at 12 AM...");
    await updateFdData();
    await updateGoldData();
    await updateRealEstateData();
    logger.info("Cron job completed successfully.");
  } catch (error) {
    logger.error(`Error in cron job: ${error.message}`);
  }
});

// Server startup
app.listen(PORT, HOST, async () => {
  logger.info(`App listening at http://${HOST}:${PORT}`);
  await databaseConnection();
  await runSeeder();
});
