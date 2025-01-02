const Joi = require("joi");
const { statusCode } = require("../../../utils/api.response");

const validateFixedDeposit = (req, res, next) => {
  const isUpdating = req.method === "PUT";

  const schema = Joi.object({
    srNo: Joi.number().optional(),
    fdId: Joi.string().when("$isUpdating", {
      is: true,
      then: Joi.optional(),
      otherwise: Joi.optional(),
    }),
    fdNo: Joi.number()
      .integer()
      .positive()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "number.integer": "FD number must be an integer",
        "number.positive": "FD number must be a positive integer",
        "any.required": "FD number is required",
      }),
    firstName: Joi.string()
      .min(2)
      .max(50)
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.empty": "First name is required",
        "any.required": "First name is required",
      }),
    lastName: Joi.string()
      .min(3)
      .max(50)
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.empty": "Last name is required",
        "any.required": "Last name is required",
      }),
    fdType: Joi.string()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.empty": "FD type is required",
        "any.required": "FD type is required",
      }),
    bankId: Joi.string()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.empty": "Bank Id is required",
        "any.required": "Bank Id is required",
      }),
    branchName: Joi.string()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.empty": "Branch name is required",
        "any.required": "Branch name is required",
      }),
    interestRate: Joi.number()
      .positive()
      .max(12)
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "number.base": "Interest rate must be a number",
        "number.positive": "Interest rate must be a positive number",
        "any.required": "Interest rate is required",
      }),
    startDate: Joi.date()
      .iso()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "date.base": "Start date must be a valid date",
        "date.format": "Start date must be in ISO format (YYYY-MM-DD)",
        "any.required": "Start date is required",
      }),
    maturityDate: Joi.date()
      .iso()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "date.base": "Maturity date must be a valid date",
        "date.format": "Maturity date must be in ISO format (YYYY-MM-DD)",
        "any.required": "Maturity date is required",
      }),
    totalInvestedAmount: Joi.number()
      .positive()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "number.base": "Total invested amount must be a number",
        "number.positive": "Total invested amount must be a positive number",
        "any.required": "Total invested amount is required",
      }),
    userId: Joi.string()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.optional(),
      })
      .messages({
        "any.required": "User ID is required",
      }),
  });

  const { error } = schema.validate(req.body, { context: { isUpdating } });

  if (error) {
    return res
      .status(statusCode.BAD_REQUEST)
      .json({ error: error.details[0].message });
  }

  next();
};

module.exports = { validateFixedDeposit };
