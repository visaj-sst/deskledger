const Joi = require('joi');

const validateRealEstate = (req, res, next) => {
    const isUpdating = req.method === 'PUT';

    const schema = Joi.object({
        srNo: Joi.number().optional(),
        propertyId: Joi.string()
            .when('$isUpdating', { is: true, then: Joi.optional(), otherwise: Joi.optional() }),
        firstName: Joi.string().min(2).max(50)
            .when('$isUpdating', { is: true, then: Joi.optional(), otherwise: Joi.required() })
            .messages({
                'string.empty': 'First name is required',
                'any.required': 'First name is required',
                'string.min': 'First name must be at least 2 characters',
                'string.max': 'First name cannot exceed 50 characters'
            }),
        lastName: Joi.string().min(3).max(50)
            .when('$isUpdating', { is: true, then: Joi.optional(), otherwise: Joi.required() })
            .messages({
                'string.empty': 'Last name is required',
                'any.required': 'Last name is required',
                'string.min': 'Last name must be at least 3 characters',
                'string.max': 'Last name cannot exceed 50 characters'
            }),
        propertyTypeId: Joi.string().optional().messages({
            'string.empty': 'Property Type ID is required',
        }),
        subPropertyTypeId: Joi.string().optional().messages({
            'string.empty': 'Sub Property Type ID is required',
        }),
        propertyName: Joi.string().optional(),
        propertyAddress: Joi.string().required().messages({
            'string.empty': 'Property address is required',
            'any.required': 'Property address is required'
        }),
        cityId: Joi.string().optional().messages({
            'string.empty': 'City ID is required',
        }),
        stateId: Joi.string().optional().messages({
            'string.empty': 'State ID is required',
        }),
        areaName: Joi.string().required().messages({
            'string.empty': 'Area name is required',
            'any.required': 'Area name is required'
        }),
        areaInSquareFeet: Joi.number().positive().required().messages({
            'number.base': 'Area must be a number',
            'number.positive': 'Area must be a positive number',
            'any.required': 'Area in square feet is required'
        }),
        purchasePrice: Joi.number().positive().required().messages({
            'number.base': 'Purchase price must be a number',
            'number.positive': 'Purchase price must be a positive number',
            'any.required': 'Purchase price is required'
        }),
        currentValue: Joi.number().positive().optional().messages({
            'number.base': 'Current value must be a number',
            'number.positive': 'Current value must be a positive number'
        }),
        profit: Joi.number().optional().messages({
            'number.base': 'Profit must be a number'
        }),
        sector: Joi.string().optional().messages({
            'string.empty': 'Sector is required'
        }),
        userId: Joi.string().optional().messages({
            'string.empty': 'User ID is required'
        }),
    });

    const { error } = schema.validate(req.body, { context: { isUpdating } });

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    next();
};

module.exports = { validateRealEstate };
