export const commonAggregationStages = (
  startDate,
  maturityDate,
  totalInvestedAmount,
  interestRate
) => {
  return [
    {
      $addFields: {
        startDate: new Date(startDate),
        maturityDate: new Date(maturityDate),
        currentDate: new Date(),
      },
    },
    {
      $addFields: {
        tenureInYears: {
          $divide: [
            { $subtract: ["$maturityDate", "$startDate"] },
            1000 * 60 * 60 * 24 * 365,
          ],
        },
        tenureCompletedYears: {
          $divide: [
            { $subtract: ["$currentDate", "$startDate"] },
            1000 * 60 * 60 * 24 * 365,
          ],
        },
      },
    },
    {
      $addFields: {
        currentReturnAmount: {
          $round: [
            // Use $round for rounding instead of $trunc
            {
              $add: [
                totalInvestedAmount,
                {
                  $multiply: [
                    totalInvestedAmount,
                    {
                      $divide: [
                        { $multiply: [interestRate, "$tenureCompletedYears"] },
                        100,
                      ],
                    },
                  ],
                },
              ],
            },
            0, // Round to 0 decimal places
          ],
        },
        totalReturnedAmount: {
          $round: [
            // Use $round to match frontend
            {
              $add: [
                totalInvestedAmount,
                {
                  $multiply: [
                    totalInvestedAmount,
                    {
                      $divide: [
                        { $multiply: [interestRate, "$tenureInYears"] },
                        100,
                      ],
                    },
                  ],
                },
              ],
            },
            0, // Round to 0 decimal places
          ],
        },
        currentProfitAmount: {
          $round: [
            {
              $subtract: [
                {
                  $add: [
                    totalInvestedAmount,
                    {
                      $multiply: [
                        totalInvestedAmount,
                        {
                          $divide: [
                            {
                              $multiply: [
                                interestRate,
                                "$tenureCompletedYears",
                              ],
                            },
                            100,
                          ],
                        },
                      ],
                    },
                  ],
                },
                totalInvestedAmount,
              ],
            },
            0, // Round to 0 decimal places
          ],
        },
      },
    },
    {
      $addFields: {
        totalYears: {
          $ceil: "$tenureInYears",
        },
      },
    },
  ];
};

export const registerFdAggregation = (
  fdId,
  startDate,
  maturityDate,
  totalInvestedAmount,
  interestRate
) => [
  { $match: { _id: fdId } },
  ...commonAggregationStages(
    startDate,
    maturityDate,
    totalInvestedAmount,
    interestRate
  ),
];

export const updateFdAggregation = (
  fdId,
  startDate,
  maturityDate,
  totalInvestedAmount,
  interestRate
) => [
  { $match: { _id: fdId } },
  ...commonAggregationStages(
    startDate,
    maturityDate,
    totalInvestedAmount,
    interestRate
  ),
];
