import express from "express";

import { ensureAuthenticated } from "../../../middlewares/authValidator.js";
import {
  createGoldRecord,
  deleteGoldRecord,
  deleteMultipleGoldRecords,
  getAllGoldRecords,
  getGoldAnalysis,
  updateGoldRecord,
} from "../controller/goldController.js";

const router = express.Router();

// Gold routes
router.post("/gold/register", ensureAuthenticated, createGoldRecord);
router.put("/gold/update/:id", ensureAuthenticated, updateGoldRecord);
router.delete("/gold/delete/:id", ensureAuthenticated, deleteGoldRecord);
router.get("/gold-info", ensureAuthenticated, getAllGoldRecords);
router.get("/gold-info/:id", ensureAuthenticated, getAllGoldRecords);
router.delete(
  "/gold/delete-multiple",
  ensureAuthenticated,
  deleteMultipleGoldRecords
);
router.get("/gold-analysis", ensureAuthenticated, getGoldAnalysis);

export default router;
