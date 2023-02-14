"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../src/model/User");
const test_helpers_1 = require("./test-helpers");
const LoginRequestHandler_1 = require("../src/handlers/LoginRequestHandler");
const IBroadcastService_1 = require("../src/services/IBroadcastService");
const login_request_1 = require("../../poker.ui/src/shared/login-request");
var assert = require('assert');
var substitute = require('jssubstitute');
describe('login-request-handler-fixture', () => {
    var handler;
    let dataRepository;
    beforeEach(function () {
        process.env.POKER_K1 = '6DEF53033BC4A95E93E0995F297D97326F5C4A4BD06AB2FF106823C890D928E2';
        process.env.POKER_HMAC_KEY = 'C2B344D43A82A15CC149374D4FF3DF331398F9FBD7847633097D87E711F8EECC';
        substitute.throwErrors();
        dataRepository = test_helpers_1.TestHelpers.getDataRepository();
        let broadcastService = test_helpers_1.TestHelpers.getSubstitute(IBroadcastService_1.IBroadcastService);
        handler = new LoginRequestHandler_1.LoginRequestHandler(dataRepository, broadcastService);
    });
    let setupLoginTest = () => {
        let user = new User_1.User();
        user.activated = false;
        user.password = '$2a$05$iDZW.wlhW92whK7I.if.6e4aDxn1H8yBmW1tQ90Hu9na6Y3MBYnfO';
        dataRepository.getUserByEmail = (guid) => { return Promise.resolve(user); };
        return user;
    };
    it('login_success', async () => {
        let user = setupLoginTest();
        user.activated = true;
        let request = new login_request_1.LoginRequest("foo@bar.com", "fred");
        let result = await handler.handleLoginRequest(request, user);
        assert.equal(result.success, true);
        assert.equal(result.errorMessage, undefined);
    });
    it('login_failure_invalid_password', async () => {
        let user = setupLoginTest();
        let request = new login_request_1.LoginRequest("foo@bar.com", "fred1");
        let result = await handler.handleLoginRequest(request, user);
        assert.equal(result.success, false);
        assert.equal(result.errorMessage, 'Invalid username or password');
    });
    it('login_failure_unknown_user', async () => {
        dataRepository.getUser = (guid) => { return Promise.resolve(null); };
        let result = await handler.handleLoginRequest(new login_request_1.LoginRequest(null, null), null);
        assert.equal(result.success, false);
        assert.equal(result.errorMessage, 'Invalid username or password');
    });
});
//# sourceMappingURL=login-request-handler-fixture.js.map