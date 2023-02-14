import { Injectable } from "@angular/core";
import { AdminApiService } from "./admin-api.service";
import { isPaymentServer } from "../../app-configuration";

@Injectable()
export class SetupAdminApiService {



    constructor(private apiServer: AdminApiService) {
    }

    public initliaze(): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log(`isPaymentServer: ${isPaymentServer}`)
            if (isPaymentServer) {
                console.log('fetching remote location from payment server')

                this.apiServer.getRemoteAuth().subscribe((response) => {
                    
                    resolve(true);

                }, console.error);

            } else {
                console.log('not modifying remoteUrl as not operating on localhost')
                resolve(true);
            }


        })
    }

}