"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = void 0;
const protobuf_config_1 = __importDefault(require("./../../poker.ui/src/shared/protobuf-config"));
function broadcast(clients, data, excludeGuid) {
    let buffer = protobuf_config_1.default.serialize(data, 'DataContainer');
    for (let client of clients) {
        if (!excludeGuid || client.user.guid !== excludeGuid) {
            client.send(buffer);
        }
    }
}
exports.broadcast = broadcast;
//# sourceMappingURL=protobuf-helpers.js.map