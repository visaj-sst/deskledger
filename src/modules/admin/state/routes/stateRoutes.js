const express = require("express");
const router = express.Router();
const stateController = require("../controller/stateController.js");
const {
  ensureAuthenticated,
  ensureAdmin,
} = require("../../../../middlewares/authValidator.js");

// State Routes
router.post(
  "/state",
  ensureAuthenticated,
  ensureAdmin,
  stateController.stateRegister
);
router.put(
  "/state/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  stateController.updateState
);
router.get(
  "/states",
  ensureAuthenticated,
  ensureAdmin,
  stateController.getState
);
router.get("/states-for-user", ensureAuthenticated, stateController.getState);
router.delete(
  "/state/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  stateController.deleteState
);
router.delete(
  "/states/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  stateController.deleteMultipleStates
);

module.exports = router;
