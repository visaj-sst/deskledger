import express from "express";

const router = express.Router();

import {
  deleteGoldMasterInfo,
  getGoldMasterInfo,
  goldMasterInfoRegister,
  updateGoldMasterInfo,
} from "../controller/goldMasterController.js";

import {} from "../controller/goldMasterController.js";
import {
  ensureAdmin,
  ensureAuthenticated,
} from "../../../../middlewares/authValidator.js";

router.post(
  "/goldMaster/register",
  ensureAuthenticated,
  ensureAdmin,
  goldMasterInfoRegister
);
router.put(
  "/goldMaster/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  updateGoldMasterInfo
);
router.delete(
  "/goldMaster/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  deleteGoldMasterInfo
);
router.get("/goldMaster", ensureAuthenticated, ensureAdmin, getGoldMasterInfo);

// Multiple Delete Remaining
export default router;
