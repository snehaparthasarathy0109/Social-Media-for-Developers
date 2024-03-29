const validator = require("validator");
//import isEmpty from "./is-empty";
const isEmpty = require("./is-empty");

module.exports = function validateLoginInput(data) {
  let errors = {};

  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";

  if (validator.isEmpty(data.email)) {
    errors.email = "Email feild is required";
  }
  if (!validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }
  if (validator.isEmpty(data.password)) {
    errors.password = "Password is invalid";
  }
  if (!validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = "Password is invalid";
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
