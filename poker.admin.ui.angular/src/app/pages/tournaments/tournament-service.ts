import { TournmanetView, BlindConfigView } from "../../shared/tournmanet-view.model";
import { Injectable } from "@angular/core";
import { AdminApiService } from "../../shared/admin-api.service";

@Injectable()
export class TournamentService {

    tournaments: TournmanetView[] = [];

    

    testData(){
        for (let i = 0; i < 5; i++) {
            
            let view = new TournmanetView();    
            view._id =`507f1f77bcf86cd79943901${i+1}`;
            view.name =  `Friday Freeroll ${i+1}`;
            view.currency = 'dash';
            view.startTime = new Date(new Date().getTime() + (1*60*60*1000)).toISOString();
            view.prizes = ['0.2','0.09','0.05','0.02','0.01','0.01','0.01','0.01','0.01','0.01'];
            view.startingChips = 1000;
            view.playersPerTable = 6;
            view.minPlayers = 2;
            view.maxPlayers = 102;
            view.blindConfig = [];
            view.timeToActSec = -1;
            view.totalPrizes = '0.42';
            for(let i=0;i<12;i++){
                let smallBlind = 10*Math.pow(2, i);
                view.blindConfig.push(new BlindConfigView(smallBlind,smallBlind*2, 2));
            }
            this.tournaments.push(view)            
        }
    }
}