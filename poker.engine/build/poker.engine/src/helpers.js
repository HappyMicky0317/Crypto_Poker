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
exports.debitAccount = exports.isWithinPeriod = exports.isWithinLateRegistration = exports.getTournamentViewRow = exports.getFundAccountResult = exports.getIpAddress = exports.getRandomItemAndIndex = exports.getRandomItem = exports.awardPrizes = exports.getTotalPrize = exports.getCalculatedPrizes = exports.getAdminTournamentResultsView = exports.getBlindConfig = exports.transferTableBalance = exports.setupTable = exports.getTableViewRow = exports.getGravatar = exports.getUserData = exports.toUserStatus = exports.removeItem = exports.hashPassword = exports.Helpers = void 0;
const Currency_1 = require("../../poker.ui/src/shared/Currency");
const decimal_1 = require("./../../poker.ui/src/shared/decimal");
const DataContainer_1 = require("../../poker.ui/src/shared/DataContainer");
const bcrypt = require("bcrypt");
const table_1 = require("./table");
const TableViewRow_1 = require("../../poker.ui/src/shared/TableViewRow");
const log4js_1 = require("log4js");
var logger = (0, log4js_1.getLogger)();
const _ = __importStar(require("lodash"));
const tournmanet_view_row_1 = require("../../poker.ui/src/shared/tournmanet-view-row");
const AdminTournamentResultsView_1 = require("../../poker.admin.ui.angular/src/app/shared/AdminTournamentResultsView");
const TournmanetStatus_1 = require("../../poker.ui/src/shared/TournmanetStatus");
const shared_helpers_1 = require("./shared-helpers");
const Payment_1 = require("./model/Payment");
const PaymentType_1 = require("../../poker.ui/src/shared/PaymentType");
const PaymentStatus_1 = require("../../poker.ui/src/shared/PaymentStatus");
const Http_1 = require("./services/Http");
const QRCode = require('qrcode');
var md5 = require('md5');
class Helpers {
    static isNullOrWhitespace(input) {
        return !input || !input.trim();
    }
}
exports.Helpers = Helpers;
function hashPassword(password) {
    return new Promise((resolve, reject) => {
        let saltFactor = 5;
        bcrypt.genSalt(saltFactor, (err, salt) => {
            if (err) {
                reject(err);
            }
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    reject(err);
                }
                resolve(hash);
            });
        });
    });
}
exports.hashPassword = hashPassword;
function removeItem(array, item) {
    let index = array.indexOf(item);
    if (index > -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
}
exports.removeItem = removeItem;
function toUserStatus(wsHandle, online) {
    return new DataContainer_1.UserStatus(wsHandle.user.screenName, online, wsHandle.countryCode, wsHandle.country);
}
exports.toUserStatus = toUserStatus;
async function getUserData(user, dataRepository, initialData = true) {
    let data = new DataContainer_1.UserData();
    data.initialData = initialData;
    data.guid = user.guid;
    data.screenName = user.screenName;
    data.accounts = await dataRepository.getUserAccounts(user.guid);
    data.notifyUserStatus = user.notifyUserStatus;
    data.activated = user.activated;
    data.muteSounds = user.muteSounds;
    return data;
}
exports.getUserData = getUserData;
async function getGravatar(email) {
    let md5sum = md5(email.toLowerCase());
    const http = new Http_1.Http();
    let [err, data] = await (0, shared_helpers_1.to)(http.get(`https://www.gravatar.com/${md5sum}`));
    if (data) {
        let gravatar = `https://www.gravatar.com/avatar/${md5sum}.jpg`;
        return gravatar;
    }
    return null;
}
exports.getGravatar = getGravatar;
function getTableViewRow(table) {
    let t = table.tableConfig;
    let view = new TableViewRow_1.TableViewRow();
    view._id = t._id.toString();
    view.name = t.name;
    view.smallBlind = t.smallBlind;
    view.smallBlindUsd = t.smallBlindUsd;
    view.bigBlind = t.bigBlind;
    view.bigBlindUsd = t.bigBlindUsd;
    view.currency = t.currency;
    view.exchangeRate = t.exchangeRate;
    view.timeToActSec = t.timeToActSec;
    view.maxPlayers = t.maxPlayers;
    view.tournamentId = table.tournamentId;
    view.maxBuyIn = t.maxBuyIn;
    view.numPlayers = table.getPlayerCount();
    return view;
}
exports.getTableViewRow = getTableViewRow;
async function setupTable(config, dataRepository, processor, timerProviderFactory) {
    let table = new table_1.Table(config);
    table.processor = processor;
    table.timerProvider = timerProviderFactory(processor);
    table.dataRepository = dataRepository;
    if (config._id) {
        let data = await dataRepository.getChatMessages(config._id);
        table.chatMessages = data.reverse();
        for (let message of table.chatMessages) {
            message.tableId = undefined;
        }
    }
    if (config.currency === Currency_1.Currency.free) {
        config.smallBlind = config.smallBlindUsd * 100;
        config.bigBlind = config.bigBlindUsd * 100;
        config.exchangeRate = 1;
    }
    else if (config.currency !== Currency_1.Currency.tournament) {
        let exchangeRate = await dataRepository.getExchangeRate(config.currency);
        if (exchangeRate) {
            table.updateExchangeRate(exchangeRate.price);
        }
        else {
            let message = `for table ${table.tableConfig.name} exchangeRate not defined for currency: ${config.currency}`;
            logger.warn(message);
            return null;
        }
    }
    if (config.currency !== Currency_1.Currency.tournament) {
        let tableBalance = await dataRepository.ensureTableBalance(config._id, config.currency);
        await Promise.all(tableBalance.accounts.map(acc => {
            return table.removeTableBalance(acc.userGuid)
                .then(() => {
                return transferTableBalance(acc.userGuid, acc.balance, table.tableConfig.currency, dataRepository, `table ${table.tableConfig.name}`);
            });
        }));
    }
    return table;
}
exports.setupTable = setupTable;
async function transferTableBalance(guid, stack, currency, dataRepository, type) {
    logger.info(`${guid} adding stack of ${stack} to player account (from ${type}): ${currency}`);
    await dataRepository.updateUserAccount(guid, currency, stack);
}
exports.transferTableBalance = transferTableBalance;
function getBlindConfig(blindsStartTime, blindConfig) {
    let now = new Date();
    let totalTime = 0;
    for (let blinds of blindConfig) {
        totalTime += blinds.timeMin * 60 * 1000;
        let blindPeriod = new Date(blindsStartTime.getTime() + totalTime);
        if (blindPeriod > now) {
            let remainingTimeSec = (blindPeriod.getTime() - now.getTime()) / 1000;
            return { blinds: blinds, remainingTimeSec: remainingTimeSec };
        }
    }
    return { blinds: blindConfig[blindConfig.length - 1], remainingTimeSec: 0 };
}
exports.getBlindConfig = getBlindConfig;
async function getAdminTournamentResultsView(tournament, dataRepository) {
    let view = new AdminTournamentResultsView_1.AdminTournamentResultsView();
    view.hasAwardedPrizes = tournament.hasAwardedPrizes;
    const tournamentId = tournament._id.toString();
    let results = await dataRepository.getTournamentResults(tournamentId);
    let buyInTotal = await dataRepository.getTournamentBuyIns(tournamentId);
    view.canAwardPrizes = tournament.status == TournmanetStatus_1.TournmanetStatus.Complete && !tournament.hasAwardedPrizes;
    if (view.canAwardPrizes) {
        awardPrizes(tournament, results, buyInTotal);
    }
    for (let result of results) {
        view.results.push(new AdminTournamentResultsView_1.TournamentResultView(result.screenName, result.placing, result.prize));
    }
    return { view: view, results: results };
}
exports.getAdminTournamentResultsView = getAdminTournamentResultsView;
function getCalculatedPrizes(tournament, buyInTotal) {
    let totalPrize = getTotalPrize(tournament, buyInTotal);
    let prizes = tournament.prizes.map(p => new decimal_1.Decimal(p).mul(totalPrize));
    return prizes.map(p => p.toString());
}
exports.getCalculatedPrizes = getCalculatedPrizes;
function getTotalPrize(tournament, buyInTotal) {
    let percentageTotal = tournament.prizes.map(p => new decimal_1.Decimal(p)).reduce((a, b) => a.add(b), new decimal_1.Decimal(0));
    if (!percentageTotal.equals(1)) {
        throw new Error(`percentage array must add up to 1. percentageTotal:${percentageTotal} ${tournament._id.toString()}`);
    }
    let totalPrize = new decimal_1.Decimal(tournament.housePrize).add(buyInTotal);
    return totalPrize;
}
exports.getTotalPrize = getTotalPrize;
function awardPrizes(tournament, results, buyInTotal, roundDecimalPlaces = 4) {
    let prizes = getCalculatedPrizes(tournament, buyInTotal).map(p => new decimal_1.Decimal(p));
    let groups = _.groupBy(results, (r) => r.placing);
    let tmpText = '1';
    for (let i = 0; i < roundDecimalPlaces; i++) {
        tmpText += '0';
    }
    let roundingMultiplier = new decimal_1.Decimal(tmpText);
    let sortedKeys = _.keys(groups).map(k => parseInt(k)).sort((a, b) => a - b);
    for (let key of sortedKeys) {
        let group = groups[key.toString()];
        let groupPrizes = prizes.splice(0, group.length);
        let totalGroupPrize = groupPrizes.reduce((a, b) => a.add(b), new decimal_1.Decimal(0));
        if (totalGroupPrize.greaterThan(0)) {
            let individualPrize = totalGroupPrize.dividedBy(group.length).mul(roundingMultiplier).floor().dividedBy(roundingMultiplier);
            for (let tournamentResult of group) {
                tournamentResult.prize = individualPrize.toString();
            }
        }
        else {
            break;
        }
    }
}
exports.awardPrizes = awardPrizes;
function getRandomItem(arr) {
    let result = getRandomItemAndIndex(arr);
    return result.item;
}
exports.getRandomItem = getRandomItem;
function getRandomItemAndIndex(arr) {
    let randomIndex = Math.round((arr.length - 1) * Math.random());
    return { item: arr[randomIndex], index: randomIndex };
}
exports.getRandomItemAndIndex = getRandomItemAndIndex;
function getIpAddress(ws, request) {
    return request.headers['x-forwarded-for'] || ws._socket.remoteAddress.replace('::ffff:', '');
}
exports.getIpAddress = getIpAddress;
async function getFundAccountResult(currency, requiredConfirmations, address) {
    let data = new DataContainer_1.DataContainer();
    data.fundAccountResult = new DataContainer_1.FundAccountResult();
    data.fundAccountResult.currency = currency;
    data.fundAccountResult.requiredConfirmations = requiredConfirmations;
    data.fundAccountResult.paymentAddress = address;
    data.fundAccountResult.addressQrCode = await QRCode.toDataURL(address, { width: 115, height: 115 });
    return data;
}
exports.getFundAccountResult = getFundAccountResult;
async function getTournamentViewRow(tournament, dataRepository) {
    let view = new tournmanet_view_row_1.TournamentViewRow();
    view.id = '' + tournament._id;
    view.status = tournament.status;
    view.name = tournament.name;
    view.currency = tournament.currency;
    view.startTime = tournament.startTime;
    view.playerCount = await dataRepository.getTournamentPlayerCount(view.id);
    let buyInTotal = await dataRepository.getTournamentBuyIns(view.id);
    let prizeTotal = getTotalPrize(tournament, buyInTotal);
    view.totalPrize = prizeTotal.toString();
    view.lateRegistrationMin = tournament.lateRegistrationMin;
    view.buyIn = tournament.buyIn;
    return view;
}
exports.getTournamentViewRow = getTournamentViewRow;
function isWithinLateRegistration(tournament) {
    return tournament.status == TournmanetStatus_1.TournmanetStatus.Started
        && isWithinPeriod(tournament.startTime, tournament.lateRegistrationMin);
}
exports.isWithinLateRegistration = isWithinLateRegistration;
function isWithinPeriod(startTimeStr, intervalMin) {
    if (intervalMin) {
        let startTime = new Date(startTimeStr);
        let cutOff = new Date(startTime.getTime() + intervalMin * 60 * 1000);
        let beforeCutoff = cutOff.getTime() - new Date().getTime();
        if (beforeCutoff > 0) {
            return true;
        }
    }
    return false;
}
exports.isWithinPeriod = isWithinPeriod;
async function debitAccount(user, currency, buyIn, dataRepository, comment, tournamentPaymentMeta) {
    let { guid } = user;
    let account = await dataRepository.getUserAccount(guid, currency);
    let currencyUnit = Currency_1.CurrencyUnit.getCurrencyUnit(currency);
    let requiredAmount = new decimal_1.Decimal(buyIn).mul(currencyUnit);
    if (!account) {
        return `Account does not exist for currency ${currency}`;
    }
    else if (new decimal_1.Decimal(account.balance).lessThan(requiredAmount)) {
        return `Insufficient balance: Required amount ${requiredAmount.dividedBy(currencyUnit)} however account balance is ${account.balance / currencyUnit}`;
    }
    let updateResult = await dataRepository.updateUserAccount(guid, currency, -requiredAmount.toNumber(), account.updateIndex);
    if (updateResult.result.nModified !== 1) {
        throw new Error(`debitAccount: expecting update to exactly 1 document instead ${JSON.stringify(updateResult.result)} for player: ${guid} currency: ${currency} buyIn:${buyIn}`);
    }
    let payment = new Payment_1.Payment();
    payment.type = PaymentType_1.PaymentType.outgoing;
    payment.amount = requiredAmount.toString();
    payment.currency = currency;
    payment.guid = guid;
    payment.screenName = user.screenName;
    payment.timestamp = new Date();
    payment.status = PaymentStatus_1.PaymentStatus.complete;
    payment.comment = comment;
    if (tournamentPaymentMeta != null) {
        payment.tournamentId = tournamentPaymentMeta.tournamentId;
        payment.tournamentName = tournamentPaymentMeta.tournamentName;
        payment.isTournamentRebuy = tournamentPaymentMeta.isTournamentRebuy;
        payment.tournamentPlacing = tournamentPaymentMeta.placing;
    }
    await dataRepository.savePayment(payment);
    return '';
}
exports.debitAccount = debitAccount;
//# sourceMappingURL=helpers.js.map