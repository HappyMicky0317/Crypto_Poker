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
exports.ActivateRequestHandler = void 0;
const activate_request_1 = require("../../../poker.ui/src/shared/activate-request");
const shared_helpers_1 = require("../shared-helpers");
const handlerUtils = __importStar(require("./handler-utils"));
class ActivateRequestHandler {
    constructor(repository) {
        this.repository = repository;
    }
    async run(req, res) {
        let request = req.body;
        let result = new activate_request_1.ActivateResult();
        let user;
        let err;
        [err, user] = await (0, shared_helpers_1.to)(this.repository.getUserByActivationToken(request.token));
        if (err || !user) {
            result.errorMessage = 'Your account verification token is invalid or has expired.';
            return res.json(result);
        }
        if (user.activated) {
            result.errorMessage = 'Your account has already been verified.';
            return res.json(result);
        }
        if (user.activationToken !== request.token) {
            result.errorMessage = 'Your account verification is invalid or has expired.';
            return res.json(result);
        }
        user.activated = true;
        user.activationToken = undefined;
        let tmp;
        [err, tmp] = await (0, shared_helpers_1.to)(this.repository.saveUser(user));
        if (err) {
            result.errorMessage = err.message;
        }
        if (!result.errorMessage) {
            result.success = true;
            result.message = 'Your account verification has completed successfully!';
            result.sid = handlerUtils.getSessionId(user.guid);
        }
        res.json(result);
    }
}
exports.ActivateRequestHandler = ActivateRequestHandler;
//# sourceMappingURL=ActivateRequestHandler.js.map