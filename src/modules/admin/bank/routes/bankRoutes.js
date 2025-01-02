const express = require("express");
const router = express.Router();
const bankController = require("../controller/bankController.js");
const {
  ensureAuthenticated,
  ensureAdmin,
} = require("../../../../middlewares/authValidator.js");

//Bank Master routes
router.post(
  "/bank-register",
  ensureAuthenticated,
  ensureAdmin,
  bankController.createBank
);
router.put(
  "/bank-update/:id",
  ensureAuthenticated,
  ensureAdmin,
  bankController.updateBank
);
router.delete(
  "/bank-delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  bankController.deleteBank
);
router.put(
  "/bank-update/:id",
  ensureAuthenticated,
  ensureAdmin,
  bankController.updateBank
);
router.get("/banks", ensureAuthenticated, ensureAdmin, bankController.getBanks);
router.get(
  "/banks-dropdown-user",
  ensureAuthenticated,
  bankController.getBanks
);
router.delete(
  "/banks/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  bankController.deleteMultipleBanks
);

module.exports = router;
