const Joi = require("joi");

const validateGold = (req, res, next) => {
  const isUpdating = req.method === "PUT";

  const schema = Joi.object({
    goldId: Joi.string().optional().messages({
      "string.empty": "Gold ID cannot be empty",
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
        "string.empty": "First name cannot be empty",
        "any.required": "First name is required",
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.empty": "Last name cannot be empty",
        "any.required": "Last name is required",
      }),
    goldWeight: Joi.number()
      .positive()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "number.base": "Gold weight must be a number",
        "number.positive": "Gold weight must be a positive number",
        "any.required": "Gold weight is required",
      }),
    goldPurchasePrice: Joi.number()
      .positive()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "number.base": "Gold purchase price must be a number",
        "number.positive": "Gold purchase price must be a positive number",
        "any.required": "Gold purchase price is required",
      }),
    formOfGold: Joi.string()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.empty": "Form of gold is required",
        "any.required": "Form of gold is required",
      }),
    purityOfGold: Joi.number()
      .valid(22, 24)
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "number.base": "Purity of gold must be a number",
        "number.valid": "Purity of gold must be 22 or 24",
        "any.required": "Purity of gold is required",
      }),
  });

  const { error } = schema.validate(req.body, { context: { isUpdating } });

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

module.exports = { validateGold };
