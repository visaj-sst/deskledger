const express = require("express");

const router = express.Router();

const citycontroller = require("../controller/cityController.js");
const {
  ensureAuthenticated,
  ensureAdmin,
} = require("../../../../middlewares/authValidator.js");

// City routes
router.post(
  "/city",
  ensureAuthenticated,
  ensureAdmin,
  citycontroller.cityRegister
);
router.put(
  "/city/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  citycontroller.updateCity
);
router.get("/cities", ensureAuthenticated, ensureAdmin, citycontroller.getCity);
router.get("/cities-for-user", ensureAuthenticated, citycontroller.getCity);
router.delete(
  "/city/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  citycontroller.deleteCity
);
router.delete(
  "/cities/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  citycontroller.deleteMultipleCities
);

module.exports = router;
