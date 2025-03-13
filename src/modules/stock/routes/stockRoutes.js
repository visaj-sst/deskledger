import express from "express";
import {
  createStock,
  deleteStock,
  deleteMultipleStocks,
  getStockData,
  updateStock,
  getDatafromLiveStockPricesAndUpdate,
  getTransactionHistory,
  getTopLosers,
  getBseTopGainersAndLosers,
  getTopGainers,
} from "../controller/stockController.js";

import { ensureAuthenticated } from "../../../middlewares/authValidator.js";

const router = express.Router();

// Stock Master routes
router.post("/stock/register", createStock);
router.patch("/stock/update/:id", updateStock);
router.delete("/stock/delete/:id", deleteStock);
router.get("/trading", getStockData);
router.delete("/stocks/multiple-delete", deleteMultipleStocks);
router.get("/stocks/get-live-prices", getDatafromLiveStockPricesAndUpdate);
router.get("/stocks/transaction-history/:stockSymbol", getTransactionHistory);
router.get("/stocks/transaction-history", getTransactionHistory);
router.get("/stocks/top-movers", getBseTopGainersAndLosers);
router.get("/stocks/top-gainers", getTopGainers);
router.get("/stocks/top-losers", getTopLosers);

export default router;
