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
exports.ResetRequestHandler = void 0;
const reset_result_1 = require("./../../../poker.ui/src/shared/reset-result");
const shared_helpers_1 = require("../shared-helpers");
const helpers_1 = require("../helpers");
const handlerUtils = __importStar(require("./handler-utils"));
class ResetRequestHandler {
    constructor(repository) {
        this.repository = repository;
        this.warningMsg = 'Your password reset request is invalid. Try again?';
    }
    async get(req, res) {
        let token = req.query.token;
        let result = new reset_result_1.ResetResult();
        let user;
        let err;
        [err, user] = await (0, shared_helpers_1.to)(this.repository.getUserByResetPasswordToken(token));
        if (err || !user) {
            result.errors.push(this.warningMsg);
            return res.json(result);
        }
        if (user.resetPasswordExpires < Date.now()) {
            result.errors.push('Your password reset request has expired. Try again?');
            return res.json(result);
        }
        result.success = true;
        res.json(result);
    }
    async post(req, res) {
        let request = req.body;
        let result = new reset_result_1.ResetResult();
        req.assert('password', 'Your password cannot be blank.').notEmpty();
        req.assert('confirm', 'Your password confirmation cannot be blank.').notEmpty();
        req.assert('password', 'Your password must be at least 4 characters long.').len(4);
        req.assert('confirm', 'Your passwords must match.').equals(req.body.password);
        let errors = req.validationErrors();
        if (errors) {
            result.errors = errors.map((e) => e.msg);
            return res.json(result);
        }
        let user;
        let err;
        [err, user] = await (0, shared_helpers_1.to)(this.repository.getUserByResetPasswordToken(request.token));
        if (!user) {
            result.errors.push(this.warningMsg);
        }
        else if (user.disabled) {
            result.errors.push(`Account is disabled`);
        }
        else {
            user.password = await (0, helpers_1.hashPassword)(request.password);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.activated = true;
            let tmp;
            [err, tmp] = await (0, shared_helpers_1.to)(this.repository.saveUser(user));
            if (err) {
                result.errors.push(err.message);
            }
            if (!result.errors.length) {
                result.success = true;
                result.sid = handlerUtils.getSessionId(user.guid);
            }
        }
        return res.json(result);
    }
}
exports.ResetRequestHandler = ResetRequestHandler;
//# sourceMappingURL=ResetRequestHandler.js.map