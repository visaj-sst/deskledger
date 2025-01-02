import userRoutes from "../modules/user/routes/userRoutes.js";
import fdRoutes from "../modules/fixed-deposit/routes/fixedDepositRoutes.js";
import cityRoutes from "../modules/admin/city/routes/cityRoutes.js";
import stateRoutes from "../modules/admin/state/routes/stateRoutes.js";
import goldRoutes from "../modules/gold/routes/goldRoutes.js";
import bankRoutes from "../modules/admin/bank/routes/bankRoutes.js";
import goldMasterRoutes from "../modules/admin/gold-master/routes/goldMasterRoutes.js";
import areaPriceRoutes from "../modules/admin/area-price/routes/areaPriceRoutes.js";
import propertyTypeRoutes from "../modules/admin/property-type/routes/propertyTypeRoutes.js";
import subPropertyTypeRoutes from "../modules/admin/sub-prop-type/routes/subPropertyTypeRoutes.js";
import realEstateRoutes from "../modules/real-estate/routes/realEstateRoutes.js";
import dashboardRoutes from "../modules/dashboard/routes/dashboardRoutes.js";

export const routes = [
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
