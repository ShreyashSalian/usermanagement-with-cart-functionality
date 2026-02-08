import { checkSchema } from "express-validator";
import { trimInput } from "../utils/function";

export const loginValidation = () => {
  return checkSchema({
    userNameOrEmail: {
      notEmpty: {
        errorMessage: "Please enter the email or userName.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
    password: {
      notEmpty: {
        errorMessage: "Please enter password.",
      },
      customSanitizer: {
        options: trimInput,
      },
    },
  });
};
