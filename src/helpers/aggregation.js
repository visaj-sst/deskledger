const commonAggregationStages = (startDate, maturityDate, totalInvestedAmount, interestRate) => {
  return [
    {
      $addFields: {
        startDate: new Date(startDate),
        maturityDate: new Date(maturityDate),
        currentDate: new Date(),
      }
    },
    {
      $addFields: {
        tenureInYears: { 
          $divide: [{ $subtract: ["$maturityDate", "$startDate"] }, 1000 * 60 * 60 * 24 * 365] 
        },
        tenureCompletedYears: { 
          $divide: [{ $subtract: ["$currentDate", "$startDate"] }, 1000 * 60 * 60 * 24 * 365] 
        }
      } 
    },
    {
      $addFields: {
        currentReturnAmount: {
          $trunc: {
            $add: [
              totalInvestedAmount,
              { 
                $multiply: [
                  totalInvestedAmount, 
                  { $divide: [{ $multiply: [interestRate, "$tenureCompletedYears"] }, 100] }
                ]
              }
            ]
          }
        },
        totalReturnedAmount: {
          // Updated to match the frontend calculation
          $trunc: {
            $add: [
              totalInvestedAmount,
              { 
                $multiply: [
                  totalInvestedAmount, 
                  { $divide: [{ $multiply: [interestRate, "$tenureInYears"] }, 100] }  // Same as frontend formula
                ]
              }
            ]
          }
        },
        currentProfitAmount: {
          $trunc: {
            $subtract: [
              { $add: [
                totalInvestedAmount,
                { 
                  $multiply: [
                    totalInvestedAmount, 
                    { $divide: [{ $multiply: [interestRate, "$tenureCompletedYears"] }, 100] }
                  ]
                }
              ]},
              totalInvestedAmount
            ]
          }
        }
      }
    },
    {
      $addFields: {
        totalYears: {
          $ceil: "$tenureInYears" 
        }
      }
    }
  ];
};

const registerFdAggregation = (fdId, startDate, maturityDate, totalInvestedAmount, interestRate) => [
  { $match: { _id: fdId } },
  ...commonAggregationStages(startDate, maturityDate, totalInvestedAmount, interestRate)
];

const updateFdAggregation = (fdId, startDate, maturityDate, totalInvestedAmount, interestRate) => [
  { $match: { _id: fdId } },
  ...commonAggregationStages(startDate, maturityDate, totalInvestedAmount, interestRate)
];

module.exports = {
  registerFdAggregation,
  updateFdAggregation
};
