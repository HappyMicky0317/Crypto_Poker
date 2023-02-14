"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDataRepository = void 0;
class IDataRepository {
    getTablesConfig() { throw new Error("Not implemented"); }
    ;
    getUser(guid) { throw new Error("Not implemented"); }
    ;
    getUserAccount(guid, currency) { throw new Error("Not implemented"); }
    ;
    getUserAccounts(guid) { throw new Error("Not implemented"); }
    ;
    saveUser(user) { throw new Error("Not implemented"); }
    ;
    saveGame(game) { throw new Error("Not implemented"); }
    ;
    saveExchangeRate(exchangeRate) { throw new Error("Not implemented"); }
    ;
    getExchangeRate(base) { throw new Error("Not implemented"); }
    ;
    getExchangeRates() { throw new Error("Not implemented"); }
    ;
    saveClientMessage(message, tableId, guid) { throw new Error("Not implemented"); }
    ;
    getPayments(args) { throw new Error("Not implemented"); }
    ;
    getPaymentsSince(id) { throw new Error("Not implemented"); }
    ;
    getLastPaymentUpdate() { throw new Error("Not implemented"); }
    ;
    savePayment(payment) { throw new Error("Not implemented"); }
    ;
    saveTableConfig(tableConfig) { throw new Error("Not implemented"); }
    ;
    deleteTableConfig(id) { throw new Error("Not implemented"); }
    ;
    deleteUser(guid) { throw new Error("Not implemented"); }
    ;
    saveChat(globalChatRequest) { throw new Error("Not implemented"); }
    ;
    getChatMessages(tableId) { throw new Error("Not implemented"); }
    ;
    getGames(tableId, userGuid, tournamentId, skip, limit) { throw new Error("Not implemented"); }
    ;
    getGamesByUserGuid(userGuid, currency) { throw new Error("Not implemented"); }
    ;
    updateUserAccount(guid, currency, balance, updateIndex) { throw new Error("Not implemented"); }
    ;
    getUsers(searchTerm, limit, includeAnon) { throw new Error("Not implemented"); }
    ;
    updateTableBalance(tableId, account) { throw new Error("Not implemented"); }
    ;
    ensureTableBalance(tableId, currency) { throw new Error("Not implemented"); }
    ;
    removeTableBalance(tableId, userGuid) { throw new Error("Not implemented"); }
    ;
    updateTableBalances(tableId, currency, accounts) { throw new Error("Not implemented"); }
    ;
    getPaymentByTxId(currency, txId) { throw new Error("Not implemented"); }
    ;
    getPaymentIncomingByTournamentId(tournamentId, userGuid) { throw new Error("Not implemented"); }
    ;
    getTournamentBuyIns(tournamentId) { throw new Error("Not implemented"); }
    ;
    getPaymentById(id) { throw new Error("Not implemented"); }
    ;
    getTableBalancesByUserGuid(userGuid) { throw new Error("Not implemented"); }
    getUsersByScreenName(screenName) { throw new Error("Not implemented"); }
    getUserByEmail(email) { throw new Error("Not implemented"); }
    getUserByActivationToken(token) { throw new Error("Not implemented"); }
    getUserByResetPasswordToken(token) { throw new Error("Not implemented"); }
    mergeGames(mergeFromGuid, mergeToGuid) { throw new Error("Not implemented"); }
    mergePayments(mergeFromGuid, mergeToGuid) { throw new Error("Not implemented"); }
    deleteUserReconcilliation(guid) { throw new Error("Not implemented"); }
    getUnusedSweepPayment(guid) { throw new Error("Not implemented"); }
    ;
    getAddressInfo(guid, currency, processed) { throw new Error("Not implemented"); }
    ;
    getAddressInfoByAddress(address) { throw new Error("Not implemented"); }
    ;
    saveAddress(info) { throw new Error("Not implemented"); }
    ;
    saveReconcilliationView(view) { throw new Error("Not implemented"); }
    ;
    getReconcilliationView() { throw new Error("Not implemented"); }
    ;
    saveTournmanet(tournmanet) { throw new Error("Not implemented"); }
    ;
    getTournaments(args, limit, meta) { throw new Error("Not implemented"); }
    ;
    getTournmanetById(id) { throw new Error("Not implemented"); }
    ;
    deleteTournmanet(id) { throw new Error("Not implemented"); }
    ;
    saveTournamentRegistration(registration) { throw new Error("Not implemented"); }
    ;
    getTournamentRegistrations(args) { throw new Error("Not implemented"); }
    ;
    getTournamentPlayerCount(tournamentId) { throw new Error("Not implemented"); }
    ;
    saveTableStates(states) { throw new Error("Not implemented"); }
    ;
    getTableStates(args) { throw new Error("Not implemented"); }
    ;
    saveTournamentResult(results) { throw new Error("Not implemented"); }
    ;
    deleteTournamentResult(tournamentId, userGuid) { throw new Error("Not implemented"); }
    ;
    getTournamentResults(tournamentId) { throw new Error("Not implemented"); }
    ;
    updateTournamentHasAwardedPrizes(tournamentId) { throw new Error("Not implemented"); }
    ;
    getCurrencyConfig(currency) { throw new Error("Not implemented"); }
    ;
    getCurrencyConfigs() { throw new Error("Not implemented"); }
    ;
    saveCurrencyConfig(token) { throw new Error("Not implemented"); }
    ;
    saveChangeSeatHistory(history) { throw new Error("Not implemented"); }
    ;
    saveTableProcessorMessage(message) { throw new Error("Not implemented"); }
    ;
    getBlockedCountries() { throw new Error("Not implemented"); }
    ;
    createNextUserDocument() { throw new Error("Not implemented"); }
    ;
    getNextUserIndex() { throw new Error("Not implemented"); }
    ;
    getAddressInfoSince(id) { throw new Error("Not implemented"); }
    ;
    getUserBalances(currency) { throw new Error("Not implemented"); }
    ;
    getAdmins() { throw new Error("Not implemented"); }
    ;
    saveAdmin(admin) { throw new Error("Not implemented"); }
    ;
}
exports.IDataRepository = IDataRepository;
//# sourceMappingURL=IDataRepository.js.map