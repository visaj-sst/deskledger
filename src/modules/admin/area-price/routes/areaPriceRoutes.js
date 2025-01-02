const express = require("express");

const router = express.Router();

const areaPriceController = require("../controller/areaPriceController.js");

const {
  ensureAuthenticated,
  ensureAdmin,
} = require("../../../../middlewares/authValidator.js");

// Area Price routes
router.post(
  "/area-price/register",
  ensureAuthenticated,
  ensureAdmin,
  areaPriceController.createAreaPrice
);
router.put(
  "/area-price/update/:id",
  ensureAuthenticated,
  ensureAdmin,
  areaPriceController.updateAreaPrice
);
router.delete(
  "/area-price/delete/:id",
  ensureAuthenticated,
  ensureAdmin,
  areaPriceController.deleteAreaPrice
);
router.get(
  "/area-prices",
  ensureAuthenticated,
  ensureAdmin,
  areaPriceController.getAreaPrices
);
router.get(
  "/area-prices-for-user",
  ensureAuthenticated,
  areaPriceController.getAreaPrices
);
router.delete(
  "/area-price/multiple-delete",
  ensureAuthenticated,
  ensureAdmin,
  areaPriceController.deleteMultipleAreaPrices
);

module.exports = router;
