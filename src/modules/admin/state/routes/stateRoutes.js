import express from "express";
import {
  ensureAuthenticated,
  ensureAdmin,
} from "../../../../middlewares/authValidator.js";
import {
  deleteMultipleStates,
  deleteState,
  getState,
  stateRegister,
  updateState,
} from "../controller/stateController.js";

const router = express.Router();

// State Routes
router.post("/state", ensureAuthenticated, ensureAdmin, stateRegister);
router.put("/state/update/:id", ensureAuthenticated, ensureAdmin, updateState);
router.get("/states", ensureAuthenticated, ensureAdmin, getState);
router.get("/states-for-user", ensureAuthenticated, getState);
router.delete(
  "/state/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  deleteState
);
router.delete(
  "/states/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  deleteMultipleStates
);

export default router;
