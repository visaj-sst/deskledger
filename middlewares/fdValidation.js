const Joi = require('joi');

const validateFixedDeposit = (req, res, next) => {
    const isUpdating = req.method === 'PUT'; 

    const schema = Joi.object({
        fdNo: Joi.number()
            .required()
            .integer()
            .positive()
            .messages({
                'number.base': 'FD number must be a number',
                'number.integer': 'FD number must be an integer',
                'number.positive': 'FD number must be a positive integer',
                'any.required': 'FD number is required'
            }),
        firstName: Joi.string()
            .when('$isUpdating', { is: false, then: Joi.required() })
            .messages({
                'string.empty': 'First name is required',
                'any.required': 'First name is required'
            }),
        lastName: Joi.string()
            .when('$isUpdating', { is: false, then: Joi.required() })
            .messages({
                'string.empty': 'Last name is required',
                'any.required': 'Last name is required'
            }),
        fdType: Joi.string()
            .when('$isUpdating', { is: false, then: Joi.required() })
            .messages({
                'string.empty': 'FD type is required',
                'any.required': 'FD type is required'
            }),
        bankName: Joi.string()
            .when('$isUpdating', { is: false, then: Joi.required() })
            .messages({
                'string.empty': 'Bank name is required',
                'any.required': 'Bank name is required'
            }),
        branchName: Joi.string()
            .when('$isUpdating', { is: false, then: Joi.required() })
            .messages({
                'string.empty': 'Branch name is required',
                'any.required': 'Branch name is required'
            }),
        interestRate: Joi.number()
            .when('$isUpdating', { is: false, then: Joi.required() })
            .positive()
            .messages({
                'number.base': 'Interest rate must be a number',
                'number.positive': 'Interest rate must be a positive number',
                'any.required': 'Interest rate is required'
            }),
        startDate: Joi.date()
            .iso()
            .when('$isUpdating', { is: false, then: Joi.required() })
            .messages({
                'date.base': 'Start date must be a valid date',
                'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
                'any.required': 'Start date is required'
            }),
        maturityDate: Joi.date()
            .iso()
            .when('$isUpdating', { is: false, then: Joi.required() })
            .messages({
                'date.base': 'Maturity date must be a valid date',
                'date.format': 'Maturity date must be in ISO format (YYYY-MM-DD)',
                'any.required': 'Maturity date is required'
            }),
        totalInvestedAmount: Joi.number()
            .when('$isUpdating', { is: false, then: Joi.required() })
            .positive()
            .messages({
                'number.base': 'Total invested amount must be a number',
                'number.positive': 'Total invested amount must be a positive number',
                'any.required': 'Total invested amount is required'
            })
    }).prefs({ context: { isUpdating } });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};

module.exports = { validateFixedDeposit };