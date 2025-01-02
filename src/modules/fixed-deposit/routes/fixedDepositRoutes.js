import express from "express";
const router = express.Router();
import {
  deleteMultipleFDs,
  fixedDepositDelete,
  fixedDepositRegister,
  getFdAnalysisbyNumber,
  getFdDetails,
  updateFixedDeposit,
} from "../controller/fdcontroller.js";
import { ensureAuthenticated } from "../../../middlewares/authValidator.js";
import { validateFixedDeposit } from "../validation/fdValidator.js";

// Fixed Deposit routes
router.post(
  "/fd/register",
  ensureAuthenticated,
  validateFixedDeposit,
  fixedDepositRegister
);
router.post(
  "/fd/create",
  ensureAuthenticated,
  validateFixedDeposit,
  fixedDepositRegister
);
router.delete("/fd/delete/:id", ensureAuthenticated, fixedDepositDelete);
router.get("/fds", ensureAuthenticated, getFdDetails);
router.put(
  "/fd/update/:id",
  ensureAuthenticated,
  validateFixedDeposit,
  updateFixedDeposit
);
router.get("/fd/:id", ensureAuthenticated, getFdDetails);
router.get("/fd-analysis-number", ensureAuthenticated, getFdAnalysisbyNumber);
router.delete("/fd/delete-multiple", ensureAuthenticated, deleteMultipleFDs);

export default router;
