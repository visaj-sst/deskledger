import express from "express";
import {
  createStock,
  deleteStock,
  deleteMultipleStocks,
  getStockData,
  updateStock,
  updateStockPricesfromYahoo,
} from "../controller/stockController.js";
import { ensureAuthenticated } from "../../../middlewares/authValidator.js";

const router = express.Router();

// Stock Master routes
router.post("/stock/register", ensureAuthenticated, createStock);
router.patch("/stock/update/:id", ensureAuthenticated, updateStock);
router.delete("/stock/delete/:id", ensureAuthenticated, deleteStock);
router.get("/trading", ensureAuthenticated, getStockData);
router.delete(
  "/stocks/multiple-delete",
  ensureAuthenticated,
  deleteMultipleStocks
);
router.get(
  "/stocks/update-live-prices",
  ensureAuthenticated,
  updateStockPricesfromYahoo
);

export default router;
