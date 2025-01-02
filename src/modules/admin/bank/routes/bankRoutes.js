import express from "express";
import {
  createBank,
  deleteBank,
  deleteMultipleBanks,
  getBanks,
  updateBank,
} from "../controller/bankController.js";
import {
  ensureAdmin,
  ensureAuthenticated,
} from "../../../../middlewares/authValidator.js";

const router = express.Router();

//Bank Master routes
router.post("/bank-register", ensureAuthenticated, ensureAdmin, createBank);
router.put("/bank-update/:id", ensureAuthenticated, ensureAdmin, updateBank);
router.delete("/bank-delete/:id", ensureAuthenticated, ensureAdmin, deleteBank);
router.get("/banks", ensureAuthenticated, ensureAdmin, getBanks);
router.get("/banks-dropdown-user", ensureAuthenticated, getBanks);
router.delete(
  "/banks/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  deleteMultipleBanks
);

export default router;
