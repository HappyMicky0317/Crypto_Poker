import { TournmanetStatus } from './../../../poker.ui/src/shared/TournmanetStatus';

export class Tournament {
    _id: any;
    name:string;
    prizes: string[];
    currency: string;
    startTime: string;
    startingChips: number;
    playersPerTable: number;
    minPlayers: number;
    maxPlayers: number;
    blindConfig: BlindConfig[];
    status: TournmanetStatus;
    timeToActSec: number;
    hasAwardedPrizes: boolean = false;
    lateRegistrationMin:number;
    awardPrizesAfterMinutes: number;
    evictAfterIdleMin: number;
    sentMailchimp: boolean;
    mailchimpSendTimeMin: number;
    sentTelegram: boolean;
    telegramSendTimeMin: number;
    buyIn: string;
    housePrize: string;
    rebuyForMin: number;
    rebuyAmount: string;
}
export class BlindConfig {

    constructor(public smallBlind: number, public bigBlind: number, public timeMin: number) {


    }
}

