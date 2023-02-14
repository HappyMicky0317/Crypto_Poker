"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRequestHandler = void 0;
const signup_request_1 = require("./../../../poker.ui/src/shared/signup-request");
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const userValidation = __importStar(require("../services/user-validation"));
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const User_1 = require("../model/User");
var validator = require('validator');
const helpers_1 = require("../helpers");
const shared_helpers_1 = require("../shared-helpers");
const email_helpers_1 = require("../email-helpers");
const MailchimpService_1 = require("../services/MailchimpService");
var logger = require('log4js').getLogger();
class RegisterRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository) {
        super();
        this.dataRepository = dataRepository;
    }
    async handleMessage(wsHandle, request) {
        let registerResult = new signup_request_1.RegisterResult();
        let screenNameValidationResult = await userValidation.validateScreenName(request.screenName, wsHandle.user.guid, this.dataRepository);
        if (!screenNameValidationResult.success) {
            registerResult.errorMessage = screenNameValidationResult.errorMessage;
        }
        if (!request.password || request.password.length < 4) {
            registerResult.errorMessage = 'Your password must be at least 4 characters long.';
        }
        if (request.password !== request.confirmPassword) {
            registerResult.errorMessage = 'Your passwords do not match.';
        }
        let email = request.email ? request.email.trim() : '';
        if (!validator.isEmail(email)) {
            registerResult.errorMessage = 'Invalid email';
        }
        let existingUser = await this.dataRepository.getUserByEmail(email);
        if (existingUser) {
            registerResult.errorMessage = 'Your email address is already registered. Please use the reset password feature if you have forgotten your password';
        }
        let success = registerResult.errorMessage == undefined;
        if (success) {
            if (existingUser == null) {
                let userWithScreenName = (await this.dataRepository.getUsersByScreenName(request.screenName))[0];
                let user;
                if (!userWithScreenName) {
                    user = new User_1.User();
                    user.guid = await (0, shared_helpers_1.randomBytesHex)();
                    user.screenName = request.screenName;
                    user.updateIndex = 0;
                }
                else {
                    user = userWithScreenName;
                }
                user.email = email;
                user.gravatar = await (0, helpers_1.getGravatar)(user.email);
                user.password = await (0, helpers_1.hashPassword)(request.password);
                user.activationToken = await (0, shared_helpers_1.randomBytesHex)();
                await this.dataRepository.saveUser(user);
                let [err, data] = await (0, shared_helpers_1.to)(this.sendActivationEmail(user.email, user.activationToken, user.screenName, request.tournamentId));
                if (err) {
                    await this.dataRepository.deleteUser(user.guid);
                    registerResult.errorMessage = 'Email error';
                    success = false;
                    logger.error('sendActivationEmail', err);
                }
                else {
                    new MailchimpService_1.MailchimpService().addSubscriber(email);
                }
            }
            else {
            }
        }
        let dc = new DataContainer_1.DataContainer();
        registerResult.success = success;
        dc.registerResult = registerResult;
        wsHandle.send(dc);
    }
    async sendActivationEmail(email, activationToken, screenName, tournamentId) {
        let tournamentIdParam = tournamentId ? `&tournamentId=${tournamentId}` : '';
        let activationLink = `http://3.126.18.118:9000/?token=${activationToken}${tournamentIdParam}#/activate`;
        let details = `<p>Hello ${screenName}!</p>` +
            `<p>Welcome to ${process.env.POKER_SITE_NAME}!  Here is a link to activate your new account:</p>`
            + `<p><a href="${activationLink}">Activate my account</a></p>`;
        let subject = 'Activate your new account';
        await (0, email_helpers_1.sendStandardTemplateEmail)(email, subject, details);
    }
}
exports.RegisterRequestHandler = RegisterRequestHandler;
//# sourceMappingURL=RegisterRequestHandler.js.map