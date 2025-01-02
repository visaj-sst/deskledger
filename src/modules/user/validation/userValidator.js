// validation/userValidator

import Joi from "joi";

export const userRegisterValidate = (req, res, next) => {
  const isUpdating = req.method === "PUT";

  const schema = Joi.object({
    id: Joi.string().optional(),
    confirmPassword: Joi.string().optional(),
    image: Joi.string().optional(),

    firstName: Joi.string()
      .min(2)
      .max(50)
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.base": "First name should be a type of string",
        "string.empty": "First name cannot be empty",
        "string.min": "First name should be at least 2 characters",
        "string.max": "First name should be at most 50 characters",
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
        "string.base": "Last name should be a type of string",
        "string.empty": "Last name cannot be empty",
        "string.min": "Last name should be at least 3 characters",
        "string.max": "Last name should be at most 50 characters",
        "any.required": "Last name is required",
      }),
    phoneNo: Joi.string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.length": "Phone number should be exactly 10 digits",
        "string.pattern.base": "Phone number should contain only digits",
        "any.required": "Phone number is required",
      }),
    email: Joi.string()
      .email()
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .custom((value, helpers) => {
        const emailDomain = value.split("@")[1];
        if (/gmail\.com$/i.test(emailDomain) && /gml/.test(value)) {
          return helpers.message("Invalid email format: possible misspelling");
        }
        if (value !== value.toLowerCase()) {
          return helpers.message("Email should be in lowercase");
        }
        return value;
      })
      .messages({
        "string.base": "Email should be a type of string",
        "string.empty": "Email cannot be empty",
        "string.email": "Invalid email format",
        "any.required": "Email is required",
      }),
    password: Joi.string()
      .min(8)
      .pattern(/[a-z]/)
      .pattern(/[A-Z]/)
      .pattern(/[0-9]/)
      .pattern(/[\W_]/)
      .when("$isUpdating", {
        is: true,
        then: Joi.optional(),
        otherwise: Joi.required(),
      })
      .messages({
        "string.base": "Password should be a type of string",
        "string.empty": "Password cannot be empty",
        "string.min": "Password should be at least 8 characters",
        "string.pattern.base":
          "Password should contain at least one lowercase letter, one uppercase letter, one number, and one special character",
        "any.required": "Password is required",
      }),
    is_admin: Joi.boolean().optional(),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    context: { isUpdating },
  });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res
      .status(400)
      .json({ statusCode: 400, message: "Validation error", errors });
  }
  next();
};

export const userLoginValidate = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.base": "Email should be a type of string",
      "string.empty": "Email cannot be empty",
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(8).required().messages({
      "string.base": "Password should be a type of string",
      "string.empty": "Password cannot be empty",
      "string.min": "Password should be at least 8 characters",
      "any.required": "Password is required",
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res
      .status(400)
      .json({ statusCode: 400, message: "Validation error", errors });
  }

  next();
};
