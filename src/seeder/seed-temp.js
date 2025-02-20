import mongoose from "mongoose";
import BankModel from "../modules/admin/bank/model/bank.js";
import StateModel from "../modules/admin/state/model/state.js";
import CityModel from "../modules/admin/city/model/city.js";
import PropertyTypeModel from "../modules/admin/property-type.js";
import SubPropertyTypeModel from "../modules/admin/sub-prop-type/model/subPropertyType.js";

// Database Connection
mongoose.connect("mongodb://localhost:27017/deskledger");

mongoose.connection.on("connected", async () => {
  console.log("Connected to MongoDB");
  await seedDatabase();
  mongoose.disconnect();
});

mongoose.connection.on("error", (err) => {
  console.error("Error connecting to MongoDB", err);
});

// Seeder Data
export const indianBanks = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  // Add more banks as needed
];

export const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  // Add more states as needed
];

export const indianCities = [
  { city: "Visakhapatnam", state: "Andhra Pradesh" },
  { city: "Vijayawada", state: "Andhra Pradesh" },
  { city: "Port Blair", state: "Andaman and Nicobar Islands" },
  // Add more cities with their corresponding states
];

export const propertyTypes = [
  "Residential",
  "Commercial",
  "Industrial",
  "Agricultural",
  "Mixed-Use",
];

export const subPropertyTypes = {
  Residential: ["Single-family homes", "Multi-family homes", "Apartments"],
  Commercial: ["Office buildings", "Retail spaces", "Shopping malls"],
  // Add more sub-property types under each property type
};

// Seed Function
export async function seedDatabase() {
  try {
    // Seed Banks
    const bankCount = await BankModel.countDocuments();
    if (bankCount === 0) {
      await BankModel.insertMany(
        indianBanks.map((name) => ({ bankName: name }))
      );
      console.log("Banks seeded successfully");
    }

    // Seed States and Cities
    const stateCount = await StateModel.countDocuments();
    if (stateCount === 0) {
      const stateDocs = await StateModel.insertMany(
        states.map((name) => ({ state: name }))
      );
      console.log("States seeded successfully");

      const stateMap = {};
      stateDocs.forEach((doc) => {
        stateMap[doc.state] = doc._id;
      });

      const cityDocs = indianCities.map(({ city, state }) => ({
        city,
        stateId: stateMap[state],
      }));

      await CityModel.insertMany(cityDocs);
      console.log("Cities seeded successfully");
    }

    // Seed Property Types and Sub-Property Types
    const propertyTypeCount = await PropertyTypeModel.countDocuments();
    if (propertyTypeCount === 0) {
      const propertyTypeDocs = await PropertyTypeModel.insertMany(
        propertyTypes.map((type) => ({ propertyType: type }))
      );
      console.log("Property Types seeded successfully");

      const propertyTypeMap = {};
      propertyTypeDocs.forEach((doc) => {
        propertyTypeMap[doc.propertyType] = doc._id;
      });

      const subPropertyTypeDocs = [];
      for (const [type, subTypes] of Object.entries(subPropertyTypes)) {
        subTypes.forEach((subType) => {
          subPropertyTypeDocs.push({
            subPropertyType: subType,
            propertyTypeId: propertyTypeMap[type],
          });
        });
      }

      await SubPropertyTypeModel.insertMany(subPropertyTypeDocs);
      console.log("Sub-Property Types seeded successfully");
    }

    console.log("Seeding completed.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
