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
const assert = __importStar(require("assert"));
const ChangeSeatingLogic_1 = require("../../src/tournament/ChangeSeatingLogic");
const table_1 = require("../../src/table");
const helpers_1 = require("../../src/helpers");
const test_helpers_1 = require("../test-helpers");
const JoinTableRequest_1 = require("../../src/model/table/JoinTableRequest");
describe('ChangeSeatingLogic', () => {
    let userIdIndex;
    let getJoinTableRequest = (seat, user, stack) => {
        return new JoinTableRequest_1.JoinTableRequest(seat, user.guid, user.screenName, user.gravatar, stack);
    };
    beforeEach(() => {
        userIdIndex = 1;
    });
    let getTable = (id, maxNumPlayers) => {
        return new table_1.Table({ _id: (id != null ? `id${id}` : 'id1'), maxPlayers: maxNumPlayers || 6 });
    };
    let addPlayersToTableRandom = (table, count) => {
        for (let i = 0; i < count; i++) {
            let user = { guid: `userGuid_${userIdIndex}_table_${table.tableConfig._id}` };
            userIdIndex++;
            let emptySeats = table.getEmptySeats();
            let randomSeat = (0, helpers_1.getRandomItem)(emptySeats);
            table.addPlayerHandle(getJoinTableRequest(randomSeat, user, 1000));
        }
    };
    it('empty', () => {
        let table = getTable();
        let tables = [table];
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table, []);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 0);
    });
    it('single player joins new table', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let user1 = { guid: 'u1' };
        let user2 = { guid: 'u2' };
        table1.addPlayerHandle(getJoinTableRequest(1, user1, 1000));
        table2.addPlayerHandle(getJoinTableRequest(1, user2, 1000));
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 1);
        assert.equal(result.leaving[0].seat, 2);
        assert.equal(result.leaving[0].handle.guid, 'u1');
        assert.equal(result.leaving[0].table, table2);
        checkLeaving(result, table2);
    });
    it('single player does not join new table as table is full', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let user1 = { guid: 'u1' };
        let user2 = { guid: 'u2' };
        table1.addPlayerHandle(getJoinTableRequest(1, user1, 1000));
        for (let i = 1; i <= table2.tableConfig.maxPlayers; i++) {
            table2.addPlayerHandle(getJoinTableRequest(i, { guid: `table2_${i}` }, 1));
        }
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 0);
    });
    it('two players are moved', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 2);
        addPlayersToTableRandom(table2, 4);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 2);
        checkLeaving(result, table2);
    });
    it('three players are moved to two different tables', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let table3 = getTable(3);
        addPlayersToTableRandom(table1, 3);
        addPlayersToTableRandom(table2, 4);
        addPlayersToTableRandom(table3, 4);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2, table3]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 3);
        checkLeaving(result, table2);
    });
    it('table with threshold number of players are not moved', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 4);
        addPlayersToTableRandom(table2, 2);
        table2.setCurrentPlayers(table2.getPlayers().slice(0));
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 0);
    });
    it('table with threshold number of players are moved due to inactivity of some players', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 4);
        table1.getPlayers()[0].isDisconnected = true;
        table1.getPlayers()[1].isSittingOut = true;
        addPlayersToTableRandom(table2, 4);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 2);
        assert.notEqual(null, result.leaving.find(u => u.handle == table1.getPlayers()[2]), 'expecting player to leave table');
        assert.notEqual(null, result.leaving.find(u => u.handle == table1.getPlayers()[3]), 'expecting player to leave table');
        checkLeaving(result, table2);
    });
    it('players are moved to different tables', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let table3 = getTable(3);
        addPlayersToTableRandom(table1, 2);
        addPlayersToTableRandom(table2, 5);
        addPlayersToTableRandom(table3, 5);
        let tables = [table2, table3];
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, tables);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 2);
        assert.notEqual(null, result.leaving.find(u => u.handle == table1.getPlayers()[0]), 'expecting player to leave table');
        assert.notEqual(null, result.leaving.find(u => u.handle == table1.getPlayers()[1]), 'expecting player to leave table');
        checkLeaving(result, table2);
        checkLeaving(result, table3);
    });
    it('players are not moved to different tables as players are inactive on target tables', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let table3 = getTable(3);
        addPlayersToTableRandom(table1, 2);
        addPlayersToTableRandom(table2, 5);
        addPlayersToTableRandom(table3, 5);
        table2.setCurrentPlayers(table2.getPlayers().slice(0));
        table3.setCurrentPlayers(table3.getPlayers().slice(0));
        for (let i = 0; i < 4; i++) {
            table2.getPlayers()[i].isDisconnected = true;
            table3.getPlayers()[i].isDisconnected = true;
        }
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2, table3]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 0);
    });
    it('players are not moved that would result in an idle table 1', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 2);
        addPlayersToTableRandom(table2, 5);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 0);
        checkLeaving(result, table2);
    });
    it('player is joined to table', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 5);
        addPlayersToTableRandom(table2, 1);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 1);
        assert.equal(result.joining[0].handle, table2.getPlayers()[0]);
        assert.equal(result.joining[0].table, table2);
        assert.equal(result.leaving.length, 0);
        checkJoining(result, table1);
    });
    it('player is joined to table; other players from tables are skipped', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let table3 = getTable(2);
        addPlayersToTableRandom(table1, 5);
        addPlayersToTableRandom(table2, 6);
        table2.setCurrentPlayers(table2.getPlayers().slice(0));
        addPlayersToTableRandom(table3, 1);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2, table3]);
        assert.equal(result.joining.length, 1);
        assert.equal(result.joining[0].handle, table3.getPlayers()[0]);
        assert.equal(result.joining[0].table, table3);
        assert.equal(result.leaving.length, 0);
        checkJoining(result, table1);
    });
    it('players joined to table do not exceed max num players', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 5);
        addPlayersToTableRandom(table2, 6);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 0);
    });
    it('disconnected player is joined to table ', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 5);
        addPlayersToTableRandom(table2, 1);
        table2.getPlayers()[0].isDisconnected = true;
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 1);
        assert.equal(result.joining[0].handle, table2.getPlayers()[0]);
        assert.equal(result.joining[0].table, table2);
        assert.equal(result.leaving.length, 0);
        checkJoining(result, table1);
    });
    it('idle active players are joined to table in preference to disconnected ', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let table3 = getTable(3);
        addPlayersToTableRandom(table1, 4);
        addPlayersToTableRandom(table2, 6);
        addPlayersToTableRandom(table3, 1);
        for (let player of table2.getPlayers())
            player.isDisconnected = true;
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2, table3]);
        assert.equal(result.joining.length, 1);
        assert.equal(result.joining[0].handle, table3.getPlayers()[0]);
        assert.equal(result.joining[0].table, table3);
        assert.equal(result.leaving.length, 0);
        checkJoining(result, table1);
    });
    it('two tables are merged ', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 3);
        addPlayersToTableRandom(table2, 3);
        let tables = [table1, table2];
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, tables);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 3);
        checkLeaving(result, table2);
    });
    it('two tables are merged2 ', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 3);
        addPlayersToTableRandom(table2, 3);
        for (let table of [table1, table2]) {
            for (let player of table.getPlayers()) {
                player.isDisconnected = true;
            }
        }
        let tables = [table2];
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, tables);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 3);
        checkLeaving(result, table2);
    });
    it('tables are not merged as no benefit 1', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 3);
        addPlayersToTableRandom(table2, 4);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 0);
    });
    it('tables are not merged as no benefit 2', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 4);
        addPlayersToTableRandom(table2, 3);
        table2.setCurrentPlayers(table2.getPlayers().slice(0));
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 0);
    });
    it('player is joined to table 2', () => {
        let table1 = getTable(1, 4);
        let table2 = getTable(2, 4);
        addPlayersToTableRandom(table1, 3);
        addPlayersToTableRandom(table2, 1);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 1);
        assert.equal(result.joining[0].handle, table2.getPlayers()[0]);
        assert.equal(result.leaving.length, 0);
        checkJoining(result, table1);
    });
    it('players are moved to table with a single player', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 6);
        addPlayersToTableRandom(table2, 1);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 2);
        checkLeaving(result, table2);
    });
    it('players are moved to table with most empty seats', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let table3 = getTable(3);
        addPlayersToTableRandom(table1, 6);
        addPlayersToTableRandom(table2, 3);
        addPlayersToTableRandom(table3, 2);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2, table3]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 2);
        assert.equal(true, result.leaving[0].table == table3);
        assert.equal(true, result.leaving[1].table == table3);
        checkLeaving(result, table3);
    });
    it('full table players leave 1', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let table3 = getTable(3);
        addPlayersToTableRandom(table1, 6);
        addPlayersToTableRandom(table2, 6);
        addPlayersToTableRandom(table3, 4);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table3, [table1, table2]);
        assert.equal(result.joining.length, 1);
        assert.equal(result.leaving.length, 0);
        assert.equal(true, result.joining[0].table == table1);
        checkJoining(result, table3);
    });
    it('table is evened', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 6);
        addPlayersToTableRandom(table2, 4);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 1);
        assert.equal(true, result.leaving[0].table == table2);
        checkLeaving(result, table2);
    });
    it('players are not moved as no benefit 1', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 5);
        addPlayersToTableRandom(table2, 4);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.leaving.length, 0);
        assert.equal(result.joining.length, 0);
    });
    it('players are not moved as no benefit 2', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 5);
        addPlayersToTableRandom(table2, 3);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.leaving.length, 1);
        assert.equal(result.joining.length, 0);
    });
    it('multi table move', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let table3 = getTable(3);
        addPlayersToTableRandom(table1, 2);
        addPlayersToTableRandom(table2, 2);
        addPlayersToTableRandom(table3, 6);
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table3, [table1, table2]);
        assert.equal(result.leaving.length, 2);
        assert.equal(true, result.leaving[0].table == table1);
        assert.equal(true, result.leaving[1].table == table2);
        assert.equal(result.joining.length, 0);
        checkLeaving(result, table2);
    });
    it('players are not moved as no active players at table', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        addPlayersToTableRandom(table1, 6);
        addPlayersToTableRandom(table2, 3);
        for (let player of table2.getPlayers()) {
            player.isSittingOut = true;
        }
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 0);
    });
    it('player is not moved from table as no benefit due to disconnected players', () => {
        let table1 = getTable();
        let table2 = getTable(2);
        let table3 = getTable(3);
        addPlayersToTableRandom(table1, 6);
        addPlayersToTableRandom(table2, 5);
        addPlayersToTableRandom(table3, 4);
        table1.getPlayers()[0].isSittingOut = true;
        table1.getPlayers()[1].isSittingOut = true;
        table1.getPlayers()[2].isSittingOut = true;
        table2.getPlayers()[0].isSittingOut = true;
        table3.getPlayers()[0].isDisconnected = true;
        table3.getPlayers()[1].isDisconnected = true;
        table3.getPlayers()[2].isDisconnected = true;
        let result = ChangeSeatingLogic_1.ChangeSeatingLogic.getChangeSeatingResult(table1, [table2, table3]);
        assert.equal(result.joining.length, 0);
        assert.equal(result.leaving.length, 3);
    });
    let checkJoining = (result, table) => {
        let playersMovingToTable = result.joining;
        let combined = table.getPlayers().map(h => h.seat).concat(playersMovingToTable.map(l => l.seat));
        checkTableDuplicates(combined, table.tableConfig.maxPlayers);
    };
    let checkLeaving = (result, table) => {
        let playersMovingToTable = result.leaving.filter(l => l.table == table);
        let combined = table.getPlayers().map(h => h.seat).concat(playersMovingToTable.map(l => l.seat));
        checkTableDuplicates(combined, table.tableConfig.maxPlayers);
    };
    let checkTableDuplicates = (combined, maxPlayers) => {
        if (test_helpers_1.TestHelpers.hasDuplicates(combined)) {
            console.log('combined', combined);
            assert.fail(null, null, 'table has duplicate seating');
            assert.equal(null, null);
        }
        if (combined.length > maxPlayers) {
            console.log('combined', combined);
            assert.fail(null, null, `table combined ${combined.length} has exceeded maxPlayers: ${maxPlayers}`);
        }
    };
});
//# sourceMappingURL=ChangeSeatingLogicFixture.js.map