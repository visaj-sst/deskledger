import express from "express";
import {
  ensureAdmin,
  ensureAuthenticated,
} from "../../../../middlewares/authValidator.js";

import {
  cityRegister,
  deleteCity,
  deleteMultipleCities,
  getCity,
  updateCity,
} from "../controller/cityController.js";

const router = express.Router();

// City routes
router.post("/city", ensureAuthenticated, ensureAdmin, cityRegister);
router.put("/city/update/:id", ensureAuthenticated, ensureAdmin, updateCity);
router.get("/cities", ensureAuthenticated, ensureAdmin, getCity);
router.get("/cities-for-user", ensureAuthenticated, getCity);
router.delete("/city/delete/:id", ensureAuthenticated, ensureAdmin, deleteCity);
router.delete(
  "/cities/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  deleteMultipleCities
);

export default router;
