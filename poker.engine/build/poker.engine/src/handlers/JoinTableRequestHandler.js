"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinTableRequestHandler = void 0;
const AbstractMessageHandler_1 = require("./AbstractMessageHandler");
const TableBalance_1 = require("../model/TableBalance");
const log4js_1 = require("log4js");
const TableProcessor_1 = require("../admin/processor/table-processor/TableProcessor");
const JoinTableResult_1 = require("../model/table/JoinTableResult");
const JoinTableRequest_1 = require("../model/table/JoinTableRequest");
const logger = (0, log4js_1.getLogger)();
class JoinTableRequestHandler extends AbstractMessageHandler_1.AbstractMessageHandler {
    constructor(pokerTableProvider, dataRepository) {
        super();
        this.pokerTableProvider = pokerTableProvider;
        this.dataRepository = dataRepository;
    }
    async handleMessage(handle, joinTableRequest) {
        let result = new JoinTableResult_1.JoinTableResult();
        let table = this.pokerTableProvider.findTable(joinTableRequest.tableId);
        if (!table)
            return;
        let dbUser = await this.dataRepository.getUser(handle.user.guid);
        let user = dbUser || handle.user;
        let invalidAmount = false;
        let amount;
        if (typeof (joinTableRequest.amount) === 'string') {
            amount = parseFloat(joinTableRequest.amount);
            if (isNaN(amount)) {
                invalidAmount = true;
            }
        }
        else {
            invalidAmount = true;
        }
        if (invalidAmount) {
            handle.sendError(`request amount of ${joinTableRequest.amount} is invalid`);
            return;
        }
        joinTableRequest.amount = amount;
        let request = new JoinTableRequest_1.JoinTableRequest(joinTableRequest.seat, user.guid, user.screenName, user.gravatar, joinTableRequest.amount);
        let account = await this.dataRepository.getUserAccount(user.guid, table.tableConfig.currency);
        let playerBalance = account == null ? 0 : account.balance;
        if (request.stack > playerBalance) {
            result.errorMessage = `request stack size of ${request.stack} exceeds player balance of ${playerBalance}`;
        }
        else {
            result = table.validateJoinTable(request);
        }
        if (result.success) {
            if (!dbUser) {
                await this.dataRepository.saveUser(handle.user);
            }
            await this.dataRepository.updateUserAccount(handle.user.guid, account.currency, -request.stack, account.updateIndex);
            let tableId = table.tableConfig._id.toString();
            let updateResult = await this.dataRepository.updateTableBalance(tableId, new TableBalance_1.UserTableAccount(user.guid, user.screenName, request.stack));
            if (updateResult.result.nModified !== 1) {
                throw new Error(`updateTableBalance: expecting update to exactly 1 document instead ${JSON.stringify(updateResult.result)} for player: ${user.guid} stack: ${request.stack} tableId: ${tableId}`);
            }
        }
        else {
            handle.sendError(result.errorMessage);
            return Promise.resolve(null);
        }
        let tMessage = new TableProcessor_1.TableProcessorMessage(table);
        tMessage.joinTableRequest = request;
        table.sendTableProcessorMessage(tMessage);
    }
}
exports.JoinTableRequestHandler = JoinTableRequestHandler;
//# sourceMappingURL=JoinTableRequestHandler.js.map