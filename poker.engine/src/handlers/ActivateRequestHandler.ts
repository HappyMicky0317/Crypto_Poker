import { IDataRepository } from './../services/documents/IDataRepository';
import { ActivateRequest, ActivateResult } from "../../../poker.ui/src/shared/activate-request";
import { to } from '../shared-helpers';
import { User } from '../model/User';
import * as handlerUtils from './handler-utils';

export class ActivateRequestHandler {
    
    constructor(private repository:IDataRepository) {
    
        
    }
    async run(req:any, res:any) {
        let request:ActivateRequest = req.body;
        let result:ActivateResult = new ActivateResult();
        
        let user:User;
        let err:any;
        [err, user] = await to(this.repository.getUserByActivationToken(request.token));

        if (err || !user) {
            result.errorMessage = 'Your account verification token is invalid or has expired.';
            return res.json(result);
        }

        if (user.activated) {
            result.errorMessage = 'Your account has already been verified.';
            return res.json(result);
        }

        if (user.activationToken !== request.token) {
            result.errorMessage = 'Your account verification is invalid or has expired.';
            return res.json(result);
        }

        user.activated = true;
        user.activationToken = undefined;

        let tmp: any;
        [err, tmp] = await to(this.repository.saveUser(user));
        if (err) {
            result.errorMessage = err.message;            
        }
        if(!result.errorMessage){
            result.success = true;
            result.message = 'Your account verification has completed successfully!';
            result.sid = handlerUtils.getSessionId(user.guid);
        }
        

        res.json(result);
    }
}