"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotRequestHandler = void 0;
const forgot_request_1 = require("./../../../poker.ui/src/shared/forgot-request");
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const DataContainer_1 = require("../../../poker.ui/src/shared/DataContainer");
const shared_helpers_1 = require("../shared-helpers");
const config_1 = __importDefault(require("../config"));
const email_helpers_1 = require("../email-helpers");
var logger = require('log4js').getLogger();
class ForgotRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(dataRepository) {
        super();
        this.dataRepository = dataRepository;
    }
    async handleMessage(wsHandle, request) {
        let result = new forgot_request_1.ForgotResult();
        if (!request.email) {
            result.errors.push('Please enter a valid email address.');
        }
        else {
            let user = await this.dataRepository.getUserByEmail(request.email.trim());
            if (!user || user.disabled) {
                result.errors.push('Hmmm... is that your correct email address?');
            }
            else {
                await this.sendResetEmail(user, result);
            }
        }
        let data = new DataContainer_1.DataContainer();
        data.forgotResult = result;
        wsHandle.send(data);
    }
    async sendResetEmail(user, result) {
        var hour = 3600000;
        var expiration = (hour * 4);
        user.resetPasswordToken = await (0, shared_helpers_1.randomBytesHex)();
        user.resetPasswordExpires = Date.now() + expiration;
        await this.dataRepository.saveUser(user);
        let resetLink = `${config_1.default.baseAddress}/?token=${user.resetPasswordToken}#/reset`;
        let details = `<p>Hello ${user.screenName}!</p>` +
            `<p>Here is a special link that will allow you to reset your password.  Please note it will expire in four hours for your protection:</p>`
            + `<p><a href="${resetLink}">Reset Your Password </a></p>`;
        let [err, data] = await (0, shared_helpers_1.to)((0, email_helpers_1.sendStandardTemplateEmail)(user.email, `Reset your ${process.env.POKER_SITE_NAME} password`, details));
        if (!err) {
            result.success = true;
            result.message = 'We sent you an email with further instructions. Check your email!';
        }
        else {
            logger.error(err);
        }
    }
}
exports.ForgotRequestHandler = ForgotRequestHandler;
//# sourceMappingURL=ForgotRequestHandler.js.map