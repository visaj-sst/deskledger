import express from "express";
import {
  ensureAdmin,
  ensureAuthenticated,
} from "../../../middlewares/authValidator.js";
import {
  dashboardAnalysis,
  getHighestGrowthInSector,
  getInvestmentsBySector,
} from "../controller/dashboardController2.js";

const router = express.Router();

// Dashboard routes
router.get("/overall-investment", ensureAuthenticated, dashboardAnalysis);
router.get(
  "/investments/highest-growth/:sector",
  ensureAuthenticated,
  getHighestGrowthInSector
);
router.get(
  "/investments-by-sector/:sector",
  ensureAuthenticated,
  getInvestmentsBySector
);

export default router;
