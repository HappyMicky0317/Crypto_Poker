export class ManualFundAccountRequest{
    constructor(public guid:string, public currency:string, public amount:string, public comment:string){

    }
}

export class ManualFundAccountResult{
    constructor(public success:boolean, public message:string){
        
    }
}