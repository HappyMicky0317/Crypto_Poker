"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Http = void 0;
const axios_1 = __importDefault(require("axios"));
class Http {
    get(uri, options) {
        const { stack } = new Error();
        const config = {
            headers: options === null || options === void 0 ? void 0 : options.headers,
            timeout: options === null || options === void 0 ? void 0 : options.timeout
        };
        return axios_1.default.get(uri, config).then((result) => {
            return result.data;
        }).catch(error => {
            error.stack = stack;
            throw error;
        });
    }
    ;
    post(uri, options) {
        const { stack } = new Error();
        const config = {
            headers: options.headers,
            timeout: options.timeout
        };
        return axios_1.default.post(uri, options.body, config).then((result) => {
            return result.data;
        })
            .catch(error => {
            error.stack = stack;
            throw error;
        });
    }
    ;
}
exports.Http = Http;
//# sourceMappingURL=Http.js.map