const mongoose = require('mongoose');
const BankModel = require('../models/bank'); // Adjust the path to your Bank model

require('dotenv').config();


// List of Indian banks
const indianBanks = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "IndusInd Bank",
    "Bank of Baroda",
    "Punjab National Bank",
    "Yes Bank",
    "Union Bank of India",
    "Canara Bank",
    "IDFC First Bank",
    "Federal Bank",
    "Bank of India",
    "Central Bank of India",
    "Indian Bank",
    "Indian Overseas Bank",
    "UCO Bank",
    "Punjab & Sind Bank",
    "Bank of Maharashtra",
    "RBL Bank",
    "Dhanlaxmi Bank",
    "South Indian Bank",
    "Karur Vysya Bank",
    "Tamilnad Mercantile Bank",
    "City Union Bank",
    "Lakshmi Vilas Bank",
    "IDBI Bank",
    "Jammu & Kashmir Bank",
    "Karnataka Bank",
    "Suryoday Small Finance Bank",
    "Utkarsh Small Finance Bank",
    "AU Small Finance Bank",
    "Equitas Small Finance Bank",
    "Ujjivan Small Finance Bank",
    "ESAF Small Finance Bank",
    "North East Small Finance Bank",
    "Bandhan Bank",
    "Fincare Small Finance Bank",
    "Jana Small Finance Bank"
];

// Function to insert the bank data
async function insertIndianBanks() {
    const bankDataArray = indianBanks.map(bank => ({ bankName: bank }));

    try {
        const result = await BankModel.insertMany(bankDataArray);
    } catch (err) {
        console.error('Error inserting bank data:', err.message);
    }
}

// Connect to MongoDB and run the insertion
mongoose.connect(process.env.CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000
})
.then(() => {
    insertIndianBanks();
})
.catch(err => {
    console.error('Connection error:', err.message);
});
