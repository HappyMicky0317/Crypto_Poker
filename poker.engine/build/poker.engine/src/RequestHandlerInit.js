"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestHandlerInit = void 0;
const JoinTableRequestHandler_1 = require("./handlers/JoinTableRequestHandler");
const ListTablesRequestHandler_1 = require("./handlers/ListTablesRequestHandler");
const GlobalChatRequestHandler_1 = require("./handlers/GlobalChatRequestHandler");
const LoginRequestHandler_1 = require("./handlers/LoginRequestHandler");
const RegisterRequestHandler_1 = require("./handlers/RegisterRequestHandler");
const SetAccountSettingsRequestHandler_1 = require("./handlers/SetAccountSettingsRequestHandler");
const TournamentSubscriptionRequestHandler_1 = require("./handlers/TournamentSubscriptionRequestHandler");
const TournamentRegisterRequestHandler_1 = require("./handlers/TournamentRegisterRequestHandler");
const ForgotRequestHandler_1 = require("./handlers/ForgotRequestHandler");
const SubscribeToTableRequestHandler_1 = require("./handlers/SubscribeToTableRequestHandler");
const AccountWithdrawlRequestHandler_1 = require("./handlers/AccountWithdrawlRequestHandler");
const PaymentHistoryRequestHandler_1 = require("./handlers/PaymentHistoryRequestHandler");
const FundAccountRequestHandler_1 = require("./handlers/FundAccountRequestHandler");
const TransferFundsRequestHandler_1 = require("./handlers/TransferFundsRequestHandler");
const TournamentInfoRequestHandler_1 = require("./handlers/TournamentInfoRequestHandler");
const RebuyRequestHandler_1 = require("./handlers/RebuyRequestHandler");
class RequestHandlerInit {
    init(dataRepository, processor, tournamentLogic, connectionToPaymentServer, depositAddressService) {
        processor.addHandler(new GlobalChatRequestHandler_1.GlobalChatRequestHandler(dataRepository, processor));
        processor.addHandler(new LoginRequestHandler_1.LoginRequestHandler(dataRepository, processor));
        processor.addHandler(new RegisterRequestHandler_1.RegisterRequestHandler(dataRepository));
        processor.addHandler(new SetAccountSettingsRequestHandler_1.SetAccountSettingsRequestHandler(dataRepository, processor));
        processor.addHandler(new TournamentSubscriptionRequestHandler_1.TournamentSubscriptionRequestHandler(dataRepository, tournamentLogic));
        processor.addHandler(new TournamentRegisterRequestHandler_1.TournamentRegisterRequestHandler(dataRepository, processor, tournamentLogic));
        processor.addHandler(new ForgotRequestHandler_1.ForgotRequestHandler(dataRepository));
        processor.addHandler(new ListTablesRequestHandler_1.ListTablesRequestHandler(processor));
        processor.addHandler(new SubscribeToTableRequestHandler_1.SubscribeToTableRequestHandler(processor, tournamentLogic));
        processor.addHandler(new JoinTableRequestHandler_1.JoinTableRequestHandler(processor, dataRepository));
        processor.addHandler(new AccountWithdrawlRequestHandler_1.AccountWithdrawlRequestHandler(processor, dataRepository, connectionToPaymentServer));
        processor.addHandler(new PaymentHistoryRequestHandler_1.PaymentHistoryRequestHandler(dataRepository));
        processor.addHandler(new FundAccountRequestHandler_1.FundAccountRequestHandler(processor, dataRepository, connectionToPaymentServer, depositAddressService));
        processor.addHandler(new TransferFundsRequestHandler_1.TransferFundsRequestHandler(dataRepository, processor));
        processor.addHandler(new TournamentInfoRequestHandler_1.TournamentInfoRequestHandler(dataRepository, tournamentLogic));
        processor.addHandler(new RebuyRequestHandler_1.RebuyRequestHandler(dataRepository, tournamentLogic));
    }
}
exports.RequestHandlerInit = RequestHandlerInit;
//# sourceMappingURL=RequestHandlerInit.js.map