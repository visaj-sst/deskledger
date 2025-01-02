import express from "express";

const router = express.Router();

import {
  createAreaPrice,
  deleteAreaPrice,
  deleteMultipleAreaPrices,
  getAreaPrices,
  updateAreaPrice,
} from "../controller/areaPriceController.js";

import {
  ensureAdmin,
  ensureAuthenticated,
} from "../../../../middlewares/authValidator.js";

// Area Price routes
router.post(
  "/area-price/register",
  ensureAuthenticated,
  ensureAdmin,
  createAreaPrice
);
router.put(
  "/area-price/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  updateAreaPrice
);
router.delete(
  "/area-price/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  deleteAreaPrice
);
router.get("/area-prices", ensureAuthenticated, ensureAdmin, getAreaPrices);
router.get("/area-prices-for-user", ensureAuthenticated, getAreaPrices);
router.delete(
  "/area-price/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  deleteMultipleAreaPrices
);

export default router;
