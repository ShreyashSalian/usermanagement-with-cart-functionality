import express from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import {
  asyncHandler,
  CustomRequestWithFile,
  generateEmailVerificationToken,
  rolePermission,
  sendError,
  sendSuccess,
} from "../utils/function";
import { UserModel } from "../models/user.model";
import { CONSTANT_LIST } from "../config/global.constants";
import { LoginModel } from "../models/login.model";
import { generateAccessAndRefreshToken } from "./auth.controller";
import { forgotPasswordMail } from "../utils/sendMail";
import { uploadSingleImage } from "../utils/cloudinarySingleFileUpload";
import { emailQueue } from "../utils/queue/email.queue";
import { USER_MESSAGES } from "../constants/user.constants";

export const getLoginUserDetail = asyncHandler(
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const user = req.user?.userId;
      const userDetail = await UserModel.findById(user).select("-password");
      if (userDetail) {
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          USER_MESSAGES.LOGIN_USER_DETAIL,
          userDetail,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          USER_MESSAGES.NO_USER_FOUND,
        );
      }
    } catch (err: any) {
      console.log(`Error in the login user detail api ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const addNewUser = asyncHandler(
  async (
    req: express.Request,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const customRequest = req as CustomRequestWithFile;
      const {
        firstName,
        lastName,
        email,
        contactNumber,
        password,
        userName,
      }: {
        firstName: string;
        lastName: string;
        email: string;
        contactNumber: string;
        password: string;
        userName: string;
      } = req.body;
      // const { firstName, lastName, email, contactNumber, password, userName } =
      //   req.body;
      const userAlreadyExist = await UserModel.findOne({
        $and: [
          {
            email: email,
          },
          {
            userName: userName,
          },
        ],
      });
      if (userAlreadyExist) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          USER_MESSAGES.USER_ALREADY_EXIST_WITH_EMAIL_USERNAME,
        );
      }
      const newrole = "user";
      let newPermission = [];
      if (newrole === "user") {
        newPermission = rolePermission.user;
      } else if (newrole === "manager") {
        newPermission = rolePermission.manager;
      } else {
        newPermission = rolePermission.admin;
      }
      let profileImage = null;
      if (customRequest.file) {
        profileImage = await uploadSingleImage(customRequest.file);
      }

      //Used to send the email code to user email and store the token in db
      const emailVerifyToken = await generateEmailVerificationToken();

      await emailQueue.add("VERIFY_EMAIL", {
        email,
        token: emailVerifyToken,
      });

      const userCreation = await UserModel.create({
        firstName,
        lastName,
        email,
        password,
        contactNumber,
        userName,
        role: "user",
        profileImage: profileImage,
        permission: newPermission,
        emailVerificationToken: emailVerifyToken,
      });

      if (userCreation) {
        const userDetail = await UserModel.findById(userCreation?._id).select(
          "-password",
        );
        return sendSuccess(
          res,
          CONSTANT_LIST.STATUS_SUCCESS,
          CONSTANT_LIST.STATUS_CODE_OK,
          USER_MESSAGES.USER_ADDED,
          userDetail,
        );
      } else {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          USER_MESSAGES.USER_NOT_ADDED,
        );
      }
    } catch (err: any) {
      console.log(`Error in the add user api ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const generateAccessToken = asyncHandler(
  async (
    req: express.Request<{}, {}, { refreshToken: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const incomingRefreshToken =
        req.body.refreshToken || req.cookies?.refreshToken;
      if (!incomingRefreshToken) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.UNAUTHORIZED_REQUEST,
          USER_MESSAGES.ENTER_REFRESH_TOKEN,
        );
      }
      const secretKey: string | undefined = process.env.ACCESS_TOKEN;
      if (!secretKey) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.UNAUTHORIZED_REQUEST,
          USER_MESSAGES.ENTER_REFRESH_TOKEN,
        );
      }
      const verifyRefreshToken = jwt.verify(
        incomingRefreshToken,
        secretKey,
      ) as JwtPayload;
      console.log(verifyRefreshToken);
      if (!verifyRefreshToken) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.UNAUTHORIZED_REQUEST,
          CONSTANT_LIST.UNAUTHORIZED_ERROR_MESSAGE,
        );
      }
      const user = await LoginModel.findOne({
        userId: verifyRefreshToken?.userId,
      });
      if (!user) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.UNAUTHORIZED_REQUEST,
          CONSTANT_LIST.UNAUTHORIZED_ERROR_MESSAGE,
        );
      }
      if (incomingRefreshToken !== user?.refreshToken) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.UNAUTHORIZED_REQUEST,
          CONSTANT_LIST.UNAUTHORIZED_ERROR_MESSAGE,
        );
      }
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user?.userId,
      );
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        USER_MESSAGES.ACCESS_TOKEN_GENERATED,
        {
          accessToken,
          refreshToken,
        },
      );
    } catch (err: any) {
      console.log(`Error in the add user api ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
export const changePassword = asyncHandler(
  async (
    req: express.Request<{}, {}, { oldPassword: string; newPassword: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await UserModel.findById(req.user?.userId);
      if (!user) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          USER_MESSAGES.NO_USER_FOUND,
        );
      }
      const passwordCheck = await user.comparePassword(oldPassword);
      if (!passwordCheck) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          USER_MESSAGES.ENTER_VALID_PASSWORD,
        );
      }
      user.password = newPassword;
      await user.save({ validateBeforeSave: false });
      return sendError(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        USER_MESSAGES.PASSWORD_UPDATED_SUCCESSFULLY,
      );
    } catch (err: any) {
      console.log(`Error in the add user api ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
export const forgotPassword = asyncHandler(
  async (
    req: express.Request<{}, {}, { email: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const email = req.body.email;
      const user = await UserModel.findOne({ email: email });
      if (!user) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.NO_DATA_FOUND,
          USER_MESSAGES.NO_USER_FOUND_WITH_GIVEN_EMAIL,
        );
      }
      const token = crypto.randomBytes(32).toString("hex");
      const date = Date.now() + 3600000;
      await UserModel.findByIdAndUpdate(user?.id, {
        $set: {
          resetPasswordToken: token,
          resetPasswordTokenExpiry: date,
        },
      });
      // await forgotPasswordMail(token, user?.email);
      //Push job to queue
      await emailQueue.add("FORGOT_PASSWORD", {
        email: user.email,
        token,
      });
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        USER_MESSAGES.RESET_PASSWORD_MAIL_SENT,
        {},
      );
    } catch (err: any) {
      console.log(`Error in the add user api ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const resetPassword = asyncHandler(
  async (
    req: express.Request<{}, {}, { token: string; password: string }>,
    res: express.Response,
  ): Promise<express.Response> => {
    try {
      const { token, password } = req.body;
      const user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { $gt: Date.now() },
      });
      if (!user) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          USER_MESSAGES.TOKEN_EXPIRED,
        );
      }
      user.password = password;
      user.resetPasswordToken = "";
      user.resetPasswordTokenExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        USER_MESSAGES.PASSWORD_RESET,
        {},
      );
    } catch (err: any) {
      console.log(`Error in the add user api ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);

export const userEmailVerification = asyncHandler(
  async (
    req: express.Request<{}, {}, { token: string }>,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const token = req.body.token;
      const user = await UserModel.findOne({
        emailVerificationToken: token,
      });
      if (!user) {
        return sendError(
          res,
          CONSTANT_LIST.STATUS_ERROR,
          CONSTANT_LIST.BAD_REQUEST,
          USER_MESSAGES.ENTER_VALID_TOKEN,
        );
      }
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      await user.save({ validateBeforeSave: false });
      return sendSuccess(
        res,
        CONSTANT_LIST.STATUS_SUCCESS,
        CONSTANT_LIST.STATUS_CODE_OK,
        USER_MESSAGES.EMAIL_VERIFIED,
        null,
      );
    } catch (err: any) {
      console.log(`Error in the login user detail api ${err}`);
      return sendError(
        res,
        CONSTANT_LIST.STATUS_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR,
        CONSTANT_LIST.INTERNAL_SERVER_ERROR_MESSAGE,
      );
    }
  },
);
