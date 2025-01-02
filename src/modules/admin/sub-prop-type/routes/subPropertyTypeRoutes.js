import express from "express";
const router = express.Router();
import {
  ensureAuthenticated,
  ensureAdmin,
} from "../../../../middlewares/authValidator.js";

import {
  deleteMultipleSubPropertyTypes,
  deleteSubPropertyType,
  getSubPropertyType,
  subPropertyTypeRegister,
  updateSubPropertyType,
} from "../controller/subPropertyTypeController.js";

// Sub Property Type Routes
router.post(
  "/subpropertytype",
  ensureAuthenticated,
  ensureAdmin,
  subPropertyTypeRegister
);
router.put(
  "/subpropertytype/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  updateSubPropertyType
);
router.delete(
  "/subpropertytype/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  deleteSubPropertyType
);
router.get(
  "/subpropertytypes",
  ensureAuthenticated,
  ensureAdmin,
  getSubPropertyType
);
router.get(
  "/subpropertytypes-for-user",
  ensureAuthenticated,
  getSubPropertyType
);
router.delete(
  "/subpropertytypes/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  deleteMultipleSubPropertyTypes
);

export default router;
