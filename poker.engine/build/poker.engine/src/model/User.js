"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const UserSmall_1 = require("./UserSmall");
class User {
    setScreenName() {
        if (!this.screenName) {
            this.screenName = "anon" + this.guid.substr(0, 4);
        }
    }
    toSmall() {
        return new UserSmall_1.UserSmall(this.guid, this.screenName);
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map