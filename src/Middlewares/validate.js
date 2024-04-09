const Joi = require("joi");
const Pick = require("../Utils/pick");
const StatusCode = require("../Services/commonFunctions");
// Validate API For Validation.
const validate = (schema) => (req, res, next) => {
  const validSchema = Pick(schema, ["params", "query", "body", "form-data"]);
  const object = Pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: "key" }, abortEarly: false })
    .validate(object);
  if (error) {
    const errorMessage = error.details
      .map((details) => details.message)
      .join(", ");
    return StatusCode.sendBadRequestResponse(res, errorMessage);
  }
  Object.assign(req, value);
  return next();
};

module.exports = validate;