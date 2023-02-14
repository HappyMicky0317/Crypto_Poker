"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeUserResult = exports.MergeUser = void 0;
class MergeUser {
    async run(mergeFromGuid, mergeToGuid, dataRepository) {
        let result = new MergeUserResult(false, '');
        let mergeFrom = await dataRepository.getUser(mergeFromGuid);
        let games = await dataRepository.getGames(null, mergeFromGuid, null);
        result.errorMessage = `test`;
        let sharedGameCount = 0;
        for (let game of games) {
            if (game.players.find(p => p.guid === mergeToGuid) != null) {
                sharedGameCount++;
            }
        }
        if (sharedGameCount > 0) {
            result.errorMessage = `cannot merge as players have played ${sharedGameCount} hand(s) together`;
            return result;
        }
        let mergeTo = await dataRepository.getUser(mergeToGuid);
        if (mergeFrom != null && mergeTo != null) {
            await dataRepository.mergeGames(mergeFromGuid, mergeToGuid);
            await dataRepository.mergePayments(mergeFromGuid, mergeToGuid);
            result.success = true;
        }
        return result;
    }
}
exports.MergeUser = MergeUser;
class MergeUserResult {
    constructor(success, errorMessage) {
        this.success = success;
        this.errorMessage = errorMessage;
    }
}
exports.MergeUserResult = MergeUserResult;
//# sourceMappingURL=MergeUser.js.map