const express = require("express");

const router = express.Router();

const goldMasterController = require("../controller/goldMasterController.js");

const {
  ensureAuthenticated,
  ensureAdmin,
} = require("../../../../middlewares/authValidator.js");

router.post(
  "/goldMaster/register",
  ensureAuthenticated,
  ensureAdmin,
  goldMasterController.goldMasterInfoRegister
);
router.put(
  "/goldMaster/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  goldMasterController.updateGoldMasterInfo
);
router.delete(
  "/goldMaster/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  goldMasterController.deleteGoldMasterInfo
);
router.get(
  "/goldMaster",
  ensureAuthenticated,
  ensureAdmin,
  goldMasterController.getGoldMasterInfo
);

// Multiple Delete Remaining
module.exports = router;
