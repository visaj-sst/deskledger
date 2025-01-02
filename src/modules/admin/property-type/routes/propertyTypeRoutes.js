import express from "express";
const router = express.Router();
import {
  ensureAuthenticated,
  ensureAdmin,
} from "../../../../middlewares/authValidator.js";

import {
  deleteMultiplePropertyTypes,
  deletePropertyType,
  getPropertyType,
  propertyTypeRegister,
  updatePropertyType,
} from "../controller/propertyTypeController.js";

// Property type routes
router.post(
  "/propertytype",
  ensureAuthenticated,
  ensureAdmin,
  propertyTypeRegister
);
router.put(
  "/propertytype/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  updatePropertyType
);
router.delete(
  "/propertytype/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  deletePropertyType
);
router.get("/propertytypes", ensureAuthenticated, ensureAdmin, getPropertyType);
router.get("/propertytypes-for-user", ensureAuthenticated, getPropertyType);
router.delete(
  "/propertytypes/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  deleteMultiplePropertyTypes
);

export default router;
