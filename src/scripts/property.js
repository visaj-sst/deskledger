import mongoose from 'mongoose';
import PropertyType from './models/PropertyType.js';
import SubPropertyType from './models/SubPropertyType.js';

// Property types and their sub-types
const propertyTypes = [
  "Residential",
  "Commercial",
  "Industrial",
  "Agricultural",
  "Mixed-Use",
  "Special Purpose",
  "Land",
];

const subPropertyTypes = {
  Residential: [
    "Single-family homes",
    "Multi-family homes",
    "Apartments",
    "Condominiums",
    "Townhouses",
    "Mobile homes",
    "Vacation homes",
    "Student housing",
    "Senior living facilities",
    "Luxury villas",
    "Studio apartments",
    "Penthouses",
  ],
  Commercial: [
    "Office buildings",
    "Retail spaces",
    "Shopping malls",
    "Restaurants",
    "Hotels",
    "Medical facilities",
    "Banks",
    "Gas stations",
    "Movie theaters",
    "Fitness centers",
    "Self-storage facilities",
    "Parking structures",
  ],
  Industrial: [
    "Manufacturing facilities",
    "Warehouses",
    "Distribution centers",
    "Research and development facilities",
    "Data centers",
    "Cold storage facilities",
    "Light assembly plants",
    "Flex spaces",
    "Industrial parks",
    "Logistics centers",
  ],
  Agricultural: [
    "Farmland",
    "Ranches",
    "Orchards",
    "Vineyards",
    "Greenhouses",
    "Dairy farms",
    "Livestock facilities",
    "Timber land",
  ],
  "Mixed-Use": [
    "Retail + Residential",
    "Office + Residential",
    "Live-work units",
    "Shopping + Entertainment complexes",
    "Transit-oriented developments",
  ],
  "Special Purpose": [
    "Schools",
    "Religious buildings",
    "Government buildings",
    "Sports facilities",
    "Museums",
    "Libraries",
    "Convention centers",
    "Amusement parks",
    "Marinas",
    "Nursing homes",
  ],
  Land: [
    "Vacant residential lots",
    "Commercial development sites",
    "Industrial plots",
    "Agricultural land",
    "Recreational land",
    "Raw land",
    "Entitled land",
    "Waterfront properties",
  ],
};

// Function to insert PropertyTypes and SubPropertyTypes
const insertData = async () => {
  try {
    // Insert PropertyTypes
    for (let type of propertyTypes) {
      const propertyType = await PropertyType.create({ name: type });

      // Insert SubPropertyTypes for each PropertyType
      const subTypes = subPropertyTypes[type];
      for (let subType of subTypes) {
        await SubPropertyType.create({
          subPropertyType: subType,
          propertyTypeId: propertyType._id,
        });
      }
    }
    console.log("Data inserted successfully");
  } catch (error) {
    console.log("Error inserting data:", error);
  }
};

// Connect to MongoDB and run the insertion function
mongoose
  .connect("mongodb://localhost:27017/investment", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    insertData();
  })
  .catch((err) => console.log("Error connecting to MongoDB", err));
