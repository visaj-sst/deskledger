import express from "express";

const router = express.Router();

import { ensureAuthenticated } from "../../../middlewares/authValidator.js";
import {
  createRealEstate,
  deleteMultipleRealEstates,
  deleteRealEstate,
  getAllRealEstate,
  getRealEstateAnalysis,
  updateRealEstate,
} from "../controller/realEstateController.js";

import { validateRealEstate } from "../validation/realEstateValidate.js";

router.post(
  "/real-estate/register",
  ensureAuthenticated,
  validateRealEstate,
  createRealEstate
);
router.get("/real-estate/view", ensureAuthenticated, getAllRealEstate);
router.put("/real-estate/update/:id", ensureAuthenticated, updateRealEstate);
router.delete("/real-estate/delete/:id", ensureAuthenticated, deleteRealEstate);
router.delete(
  "/real-estate/multiple-delete",
  ensureAuthenticated,
  deleteMultipleRealEstates
);
router.get("/real-estate-analysis", ensureAuthenticated, getRealEstateAnalysis);

export default router;
