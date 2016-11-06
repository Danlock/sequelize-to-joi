'use strict';
const _         = require('lodash');
const Joi       = require('joi');
const Sequelize = require('sequelize');

const map = require('./map');

function findAndConvertModels (object, options) {
    _.forIn(object, (value, key) => {
        if (value instanceof Sequelize.Model) {
            object[key] = sequelizeToJoi(value, options);
        } else if (_.isArray(value) && _.first(value) instanceof Sequelize.Model) {
            object[key] = Joi.array().items(sequelizeToJoi(_.first(value), options));
        } else if (_.isObject(value)) {
            object[key] = findAndConvertModels(value, options);
        }
    });

    return object;
}

function sequelizeToJoi(model, options) {
    options = options || {};
    let omitAssociations = options.omitAssociations || false;
    let omitAutoGenerated = options.omitAutoGenerated || false;    
    // Ensure that the model we receive is a Sequelize Model
    if (!(model instanceof Sequelize.Model)) {
        throw new TypeError('model is not an instance of Sequelize.Model');
    }

    // The validator for the Sequelize model
    let joi = Joi.object();

    // Figure out what attributes we are mapping to create the validation schema
    let attributes = model.attributes;

    if (omitAutoGenerated) {
        attributes = _.omitBy(attributes, '_autoGenerated');
    }

    // The keys we parsed out of the model
    let keys = _.mapValues(attributes, map);

    if (!omitAssociations) {
        _.each(model.associations, (reference, name) => {
            // Only go one level deep to avoid circular references
            let schema = sequelizeToJoi(reference.target, { omitAssociations: true, omitAutoGenerated });

            if (reference.isSingleAssociation) {
                keys[name] = schema;
            } else {
                keys[name] = Joi.array().items(schema);
            }
        });
    }

    return joi.keys(keys);
}
module.exports = sequelizeToJoi;
module.exports.findAndConvertModels = findAndConvertModels;