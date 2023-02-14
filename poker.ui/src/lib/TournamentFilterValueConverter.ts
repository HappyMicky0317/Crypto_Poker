export class TournamentFilterValueConverter {
    toView(array:any[], tournamentId:string) {
        if(tournamentId){            
            return array.filter(t=>t.tournamentId==tournamentId).sort((t1,t2)=> this.getTableIndex(t1) - this.getTableIndex(t2));            
        }else{
            return array.filter(t=>!t.tournamentId)
        }        
    }
    getTableIndex(table:any) : number{
        return parseInt(table.name.replace('Table', '').trim());
    }
}