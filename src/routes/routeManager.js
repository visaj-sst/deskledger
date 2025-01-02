const express = require("express");
let Router = express.Router();

const userRoutes = require("../modules/user/routes/userRoutes.js");
const fdRoutes = require("../modules/fixed-deposit/routes/fixedDepositRoutes.js");
const cityRoutes = require("../modules/admin/city/routes/cityRoutes.js");
const stateRoutes = require("../modules/admin/state/routes/stateRoutes.js");
const goldRoutes = require("../modules/gold/routes/goldRoutes.js");
const bankRoutes = require("../modules/admin/bank/routes/bankRoutes.js");
const goldMasterRoutes = require("../modules/admin/gold-master/routes/goldMasterRoutes.js");
const areaPriceRoutes = require("../modules/admin/area-price/routes/areaPriceRoutes.js");
const propertyTypeRoutes = require("../modules/admin/property-type/routes/propertyTypeRoutes.js");
const subPropertyTypeRoutes = require("../modules/admin/sub-prop-type/routes/subPropertyTypeRoutes.js");
const realEstateRoutes = require("../modules/real-estate/routes/realEstateRoutes.js");
const dashboardRoutes = require("../modules/dashboard/routes/dashboardRoutes.js");

module.exports = [
  userRoutes,
  fdRoutes,
  cityRoutes,
  stateRoutes,
  goldRoutes,
  bankRoutes,
  goldMasterRoutes,
  areaPriceRoutes,
  propertyTypeRoutes,
  subPropertyTypeRoutes,
  realEstateRoutes,
  dashboardRoutes,
];
