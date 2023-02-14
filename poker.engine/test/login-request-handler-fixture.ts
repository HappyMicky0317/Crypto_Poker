import { User } from "../src/model/User";
import { IDataRepository } from "../src/services/documents/IDataRepository";
import { TestHelpers } from "./test-helpers";
import { LoginRequestHandler } from "../src/handlers/LoginRequestHandler";
import { IBroadcastService } from "../src/services/IBroadcastService";
import { LoginRequest } from "../../poker.ui/src/shared/login-request";
var assert = require('assert');
var substitute = require('jssubstitute');

describe('login-request-handler-fixture', () => {
    var handler: LoginRequestHandler;


    let dataRepository: IDataRepository;
    beforeEach(function () {
        process.env.POKER_K1 = '6DEF53033BC4A95E93E0995F297D97326F5C4A4BD06AB2FF106823C890D928E2';
      process.env.POKER_HMAC_KEY = 'C2B344D43A82A15CC149374D4FF3DF331398F9FBD7847633097D87E711F8EECC';
        substitute.throwErrors();
        dataRepository = TestHelpers.getDataRepository();
        let broadcastService: any = TestHelpers.getSubstitute(IBroadcastService);
        handler = new LoginRequestHandler(dataRepository, broadcastService);

    });

    let setupLoginTest = (): User => {

        let user = new User();
        user.activated = false;
        user.password = '$2a$05$iDZW.wlhW92whK7I.if.6e4aDxn1H8yBmW1tQ90Hu9na6Y3MBYnfO';
        dataRepository.getUserByEmail = (guid: string) => { return Promise.resolve(user); }
        return user;
    }



    it('login_success', async () => {
        let user = setupLoginTest();
        user.activated = true;
        let request = new LoginRequest("foo@bar.com", "fred");

        let result = await handler.handleLoginRequest(request, user);

        assert.equal(result.success, true);
        assert.equal(result.errorMessage, undefined);
    });

    it('login_failure_invalid_password', async () => {
        let user = setupLoginTest();
        let request = new LoginRequest("foo@bar.com", "fred1");
        let result = await handler.handleLoginRequest(request, user);

        assert.equal(result.success, false);
        assert.equal(result.errorMessage, 'Invalid username or password');
    });

    it('login_failure_unknown_user', async () => {
        dataRepository.getUser = (guid: string) => { return Promise.resolve(null); }
        let result = await handler.handleLoginRequest(new LoginRequest(null, null), null);

        assert.equal(result.success, false);
        assert.equal(result.errorMessage, 'Invalid username or password');
    });



});

