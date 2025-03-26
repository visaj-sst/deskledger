import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import cron from "node-cron";
import logger from "./src/service/logger.service.js";
import { routes } from "./src/routes/routeManager.js";
import seedDatabase from "./src/seeder/seeds.js";
import {
  updateFdData,
  updateGoldData,
  updateRealEstateData,
  updateGoldPriceScraping,
} from "./src/cronJobs/cron.js";
import { loadScrapedDataToDB } from "./src/scripts/load-scraped-data.js";
import { startGoldPriceScraping } from "./src/scripts/gold-price-pp.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || "localhost";
const DB_CONNECTION = process.env.CONNECTION;

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      origin === "http://148.72.246.221:81" ||
      origin === "http://localhost:3000"
    ) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"), false);
    }
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "ids", "_id"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/", routes);

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
    await startGoldPriceScraping();
    await loadScrapedDataToDB();
    logger.info("Database seeding completed.");
  } catch (error) {
    logger.error(`Error during seeding: ${error.message}`);
  }
};

// Cron job
const scheduleCronJob = () => {
  const dailyGoldScrapingCron = "0 6 * * *";
  const cronExpression = "30 7 * * *";
  const updateStockPrices5min = "*/5 * * * *";

  logger.info(`Scheduling cron job with expression: ${cronExpression}`);

  try {
    cron.schedule(cronExpression, async () => {
      logger.info("Cron job running at 7:30 AM...");

      try {
        await updateFdData();
        logger.info("updateFdData completed successfully.");
      } catch (error) {
        logger.error(`Error in updateFdData: ${error.message}`);
      }

      try {
        await updateGoldData();
        logger.info("updateGoldData completed successfully.");
      } catch (error) {
        logger.error(`Error in updateGoldData: ${error.message}`);
      }

      try {
        await updateRealEstateData();
        logger.info("updateRealEstateData completed successfully.");
      } catch (error) {
        logger.error(`Error in updateRealEstateData: ${error.message}`);
      }

      logger.info("Cron job completed.");
    });

    cron.schedule(dailyGoldScrapingCron, async () => {
      logger.info("Cron job running at 6:00 AM for gold price scraping...");
      try {
        await updateGoldPriceScraping();
      } catch (error) {
        logger.error(`Error in updateGoldPriceScraping: ${error.message}`);
      }
    });

    // cron.schedule(updateStockPrices5min, async () => {
    //   logger.info("Cron job running for Stock Prices...");
    //   try {
    //     await updateStockPrices();
    //   } catch (error) {
    //     logger.error(`Error in updating Stock Prices : ${error.message}`);
    //   }
    // });

    logger.info("All cron jobs scheduled successfully.");
  } catch (error) {
    logger.error(`Failed to schedule cron jobs: ${error.message}`);
  }
};

scheduleCronJob();

app.listen(PORT, async () => {
  try {
    await databaseConnection();
    await runSeeder();
    logger.info(`App listening at http://${HOST}:${PORT}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`);
  }
});
