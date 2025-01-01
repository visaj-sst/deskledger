const express = require("express");
let Router = express.Router();

const userRoutes = require("../modules/user/routes/userRoutes");
const fdRoutes = require("../modules/fixed-deposit/routes/fixedDepositRoutes");
const cityRoutes = require("../modules/admin/city/routes/cityRoutes");
const stateRoutes = require("../modules/admin/state/routes/stateRoutes");
const goldRoutes = require("../modules/gold/routes/goldRoutes");
const bankRoutes = require("../modules/admin/bank/routes/bankRoutes");
const goldMasterRoutes = require("../modules/admin/gold-master/routes/goldMasterRoutes");
const areaPriceRoutes = require("../modules/admin/area-price/routes/areaPriceRoutes");
const propertyTypeRoutes = require("../modules/admin/property-type/routes/propertyTypeRoutes");
const subPropertyTypeRoutes = require("../modules/admin/sub-prop-type/routes/subPropertyTypeRoutes");
const realEstateRoutes = require("../modules/real-estate/routes/realEstateRoutes");
const dashboardRoutes = require("../modules/dashboard/routes/dashboardRoutes");

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
