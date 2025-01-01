const GoldModel = require('../models/goldModel'); // Adjust the path as needed

const goldData = [
    {
      "firstName": "Amit",
      "lastName": "Patel",
      "formOfGold": "Ring",
      "purityOfGold": 22,
      "goldWeight": 250,
      "goldPurchasePrice": 7000
    },
    {
      "firstName": "Rohit",
      "lastName": "Sharma",
      "formOfGold": "Necklace",
      "purityOfGold": 24,
      "goldWeight": 150,
      "goldPurchasePrice": 9000
    },
    {
      "firstName": "Sneha",
      "lastName": "Mehta",
      "formOfGold": "Bracelet",
      "purityOfGold": 22,
      "goldWeight": 200,
      "goldPurchasePrice": 7200
    },
    {
      "firstName": "Vikas",
      "lastName": "Singh",
      "formOfGold": "Chain",
      "purityOfGold": 18,
      "goldWeight": 180,
      "goldPurchasePrice": 6700
    },
    {
      "firstName": "Kiran",
      "lastName": "Desai",
      "formOfGold": "Bangle",
      "purityOfGold": 24,
      "goldWeight": 220,
      "goldPurchasePrice": 9400
    },
    {
      "firstName": "Pranav",
      "lastName": "Gupta",
      "formOfGold": "Locket",
      "purityOfGold": 22,
      "goldWeight": 90,
      "goldPurchasePrice": 5000
    },
    {
      "firstName": "Priya",
      "lastName": "Shah",
      "formOfGold": "Biscuit",
      "purityOfGold": 24,
      "goldWeight": 300,
      "goldPurchasePrice": 10000
    },
    {
      "firstName": "Rajat",
      "lastName": "Kumar",
      "formOfGold": "Necklace",
      "purityOfGold": 18,
      "goldWeight": 190,
      "goldPurchasePrice": 8000
    },
    {
      "firstName": "Meena",
      "lastName": "Rao",
      "formOfGold": "Chain",
      "purityOfGold": 22,
      "goldWeight": 200,
      "goldPurchasePrice": 7500
    },
    {
      "firstName": "Aishwarya",
      "lastName": "Joshi",
      "formOfGold": "Ring",
      "purityOfGold": 24,
      "goldWeight": 250,
      "goldPurchasePrice": 9000
    },
    {
      "firstName": "Ankit",
      "lastName": "Bansal",
      "formOfGold": "Bracelet",
      "purityOfGold": 22,
      "goldWeight": 175,
      "goldPurchasePrice": 6800
    },
    {
      "firstName": "Sonal",
      "lastName": "Tiwari",
      "formOfGold": "Bangle",
      "purityOfGold": 18,
      "goldWeight": 300,
      "goldPurchasePrice": 8500
    },
    {
      "firstName": "Vijay",
      "lastName": "Yadav",
      "formOfGold": "Necklace",
      "purityOfGold": 24,
      "goldWeight": 120,
      "goldPurchasePrice": 7000
    },
    {
      "firstName": "Swati",
      "lastName": "Agarwal",
      "formOfGold": "Chain",
      "purityOfGold": 22,
      "goldWeight": 260,
      "goldPurchasePrice": 8800
    },
    {
      "firstName": "Neha",
      "lastName": "Kapoor",
      "formOfGold": "Ring",
      "purityOfGold": 24,
      "goldWeight": 100,
      "goldPurchasePrice": 5000
    },
    {
      "firstName": "Aman",
      "lastName": "Verma",
      "formOfGold": "Biscuit",
      "purityOfGold": 22,
      "goldWeight": 300,
      "goldPurchasePrice": 9500
    },
    {
      "firstName": "Rekha",
      "lastName": "Reddy",
      "formOfGold": "Bangle",
      "purityOfGold": 18,
      "goldWeight": 280,
      "goldPurchasePrice": 8700
    },
    {
      "firstName": "Rajesh",
      "lastName": "Kumar",
      "formOfGold": "Bracelet",
      "purityOfGold": 24,
      "goldWeight": 130,
      "goldPurchasePrice": 7000
    },
    {
      "firstName": "Pooja",
      "lastName": "Iyer",
      "formOfGold": "Chain",
      "purityOfGold": 22,
      "goldWeight": 200,
      "goldPurchasePrice": 7400
    },
    {
      "firstName": "Kunal",
      "lastName": "Shah",
      "formOfGold": "Locket",
      "purityOfGold": 18,
      "goldWeight": 110,
      "goldPurchasePrice": 5000
    },
    {
      "firstName": "Siddharth",
      "lastName": "Jain",
      "formOfGold": "Necklace",
      "purityOfGold": 22,
      "goldWeight": 210,
      "goldPurchasePrice": 7700
    },
    {
      "firstName": "Mona",
      "lastName": "Gupta",
      "formOfGold": "Ring",
      "purityOfGold": 24,
      "goldWeight": 140,
      "goldPurchasePrice": 6000
    },
    {
      "firstName": "Lakshmi",
      "lastName": "Menon",
      "formOfGold": "Biscuit",
      "purityOfGold": 22,
      "goldWeight": 350,
      "goldPurchasePrice": 10500
    },
    {
      "firstName": "Ravi",
      "lastName": "Patil",
      "formOfGold": "Bracelet",
      "purityOfGold": 24,
      "goldWeight": 160,
      "goldPurchasePrice": 7000
    },
    {
      "firstName": "Arun",
      "lastName": "Rao",
      "formOfGold": "Chain",
      "purityOfGold": 18,
      "goldWeight": 180,
      "goldPurchasePrice": 6300
    },
    {
      "firstName": "Megha",
      "lastName": "Nair",
      "formOfGold": "Necklace",
      "purityOfGold": 24,
      "goldWeight": 190,
      "goldPurchasePrice": 8200
    },
    {
      "firstName": "Suresh",
      "lastName": "Deshmukh",
      "formOfGold": "Ring",
      "purityOfGold": 22,
      "goldWeight": 90,
      "goldPurchasePrice": 5000
    },
    {
      "firstName": "Harsh",
      "lastName": "Chopra",
      "formOfGold": "Bangle",
      "purityOfGold": 22,
      "goldWeight": 250,
      "goldPurchasePrice": 8400
    },
    {
      "firstName": "Anjali",
      "lastName": "Kapoor",
      "formOfGold": "Bracelet",
      "purityOfGold": 24,
      "goldWeight": 140,
      "goldPurchasePrice": 7000
    },
    {
      "firstName": "Shweta",
      "lastName": "Sharma",
      "formOfGold": "Locket",
      "purityOfGold": 18,
      "goldWeight": 110,
      "goldPurchasePrice": 4800
    }
  ];

async function insertDataInBatches(data, batchSize) {
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        try {
            await GoldModel.insertMany(batch);
        } catch (err) {
            console.error('Error inserting batch:', err);
        }
    }
}

insertDataInBatches(goldData, 10); // Inserting 10 records per batch
