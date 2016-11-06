'use strict';
const _   = require('lodash');
const Joi = require('joi');

function mapType(key, attribute) {
    switch (key) {
        // NUMBER TYPES
        case 'BIGINT':
        case 'INTEGER':
            return Joi.number().integer();

        case 'DECIMAL':
        case 'DOUBLE':
        case 'FLOAT':
            return Joi.number();

        // STRING TYPES
        case 'STRING':
        case 'TEXT':
            return Joi.string();
        case 'UUID':
            return Joi.string().guid();
        case 'ENUM':
            return Joi.string().allow(attribute.values);

        case 'DATEONLY':
        case 'DATE':
            return Joi.date();

        // OTHER TYPES
        case 'BLOB':
            return Joi.any();
        case 'BOOLEAN':
            return Joi.boolean();
        case 'JSON':
        case 'JSONB':
            return Joi.object();

        default:
            return Joi.any();
    }
}

function mapValidator(joi, validator, key) {
    if (validator === false) { return joi; }

    switch (key) {
        case 'is':
            return joi.regex(validator);
        case 'isEmail':
            return joi.email();
        case 'isUrl':
            return joi.uri();
        case 'isIP':
            return joi.ip();
        case 'isIPv4':
            return joi.ip({ version: ['ipv4'] });
        case 'isIPv6':
            return joi = joi.ip({ version: ['ipv6'] });
        case 'min':
            return joi.min(validator);
        case 'max':
            return joi.max(validator);
        case 'notEmpty':
            return joi.min(1);
        default:
            return joi;
    }
}

export default function (attribute) {
    let joi = mapType(_.get(attribute, 'type.key', ''), attribute);

    // Add model comments to schema description
    if (attribute.comment) {
        joi = joi.description(attribute.comment);
    }

    if (attribute.allowNull === false) {
        joi = joi.required();
    } else {
        joi = joi.allow(null);
    }

    if (attribute.defaultValue && !_.isObject(attribute.defaultValue) && !_.isFunction(attribute.defaultValue)) {
        joi = joi.default(attribute.defaultValue);
    }

    _.each(attribute.validate, (validator, key) => {
        joi = mapValidator(joi, validator, key);
    });

    return joi;
}
