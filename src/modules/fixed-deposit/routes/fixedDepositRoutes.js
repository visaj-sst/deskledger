const express = require("express");
const router = express.Router();
const fdcontroller = require("../controller/fdcontroller.js");
const {
  ensureAuthenticated,
} = require("../../../middlewares/authValidator.js");
const { validateFixedDeposit } = require("../validation/fdValidator.js");

// Fixed Deposit routes
router.post(
  "/fd/register",
  ensureAuthenticated,
  validateFixedDeposit,
  fdcontroller.fixedDepositRegister
);
router.post(
  "/fd/create",
  ensureAuthenticated,
  validateFixedDeposit,
  fdcontroller.fixedDepositRegister
);
router.delete(
  "/fd/delete/:id",
  ensureAuthenticated,
  fdcontroller.fixedDepositDelete
);
router.get("/fds", ensureAuthenticated, fdcontroller.getFdDetails);
router.put(
  "/fd/update/:id",
  ensureAuthenticated,
  validateFixedDeposit,
  fdcontroller.updateFixedDeposit
);
router.get("/fd/:id", ensureAuthenticated, fdcontroller.getFdDetails);
router.get(
  "/fd-analysis-number",
  ensureAuthenticated,
  fdcontroller.getFdAnalysisbyNumber
);
router.delete(
  "/fd/delete-multiple",
  ensureAuthenticated,
  fdcontroller.deleteMultipleFDs
);

module.exports = router;
