const express = require("express");
const router = express.Router();
const subPropertyTypeController = require("../controller/subPropertyTypeController");
const {
  ensureAuthenticated,
  ensureAdmin,
} = require("../../../../middlewares/authValidator");

// Sub Property Type Routes
router.post(
  "/subpropertytype",
  ensureAuthenticated,
  ensureAdmin,
  subPropertyTypeController.subPropertyTypeRegister
);
router.put(
  "/subpropertytype/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  subPropertyTypeController.updateSubPropertyType
);
router.delete(
  "/subpropertytype/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  subPropertyTypeController.deleteSubPropertyType
);
router.get(
  "/subpropertytypes",
  ensureAuthenticated,
  ensureAdmin,
  subPropertyTypeController.getSubPropertyType
);
router.get(
  "/subpropertytypes-for-user",
  ensureAuthenticated,
  subPropertyTypeController.getSubPropertyType
);
router.delete(
  "/subpropertytypes/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  subPropertyTypeController.deleteMultipleSubPropertyTypes
);

module.exports = router;
