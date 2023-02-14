import { ResetRequest, ResetResult } from './../../../poker.ui/src/shared/reset-result';
import { IDataRepository } from './../services/documents/IDataRepository';
import { ActivateRequest, ActivateResult } from "../../../poker.ui/src/shared/activate-request";
import { to } from '../shared-helpers';
import { hashPassword } from '../helpers';
import { User } from '../model/User';
import * as handlerUtils from './handler-utils';

export class ResetRequestHandler {
    
     warningMsg:string='Your password reset request is invalid. Try again?';

    constructor(private repository:IDataRepository) {
    }
    
    async get(req:any, res:any) {
        let token = req.query.token;
        let result:ResetResult = new ResetResult();
        
        let user:User;
        let err:any;
        [err, user] = await to(this.repository.getUserByResetPasswordToken(token));
        
        if (err || !user) {
            result.errors.push(this.warningMsg);
            return res.json(result);
        }
        if(user.resetPasswordExpires < Date.now()){
            result.errors.push('Your password reset request has expired. Try again?');
            return res.json(result);
        }
        
        result.success = true;

        res.json(result);
    }

    async post(req:any, res:any){
        let request:ResetRequest = req.body;
        let result:ResetResult = new ResetResult();
        
        req.assert('password', 'Your password cannot be blank.').notEmpty();
        req.assert('confirm', 'Your password confirmation cannot be blank.').notEmpty();
        req.assert('password', 'Your password must be at least 4 characters long.').len(4);
        req.assert('confirm', 'Your passwords must match.').equals(req.body.password);

        let errors = req.validationErrors();
        

      if (errors) {
        result.errors = errors.map((e:any) => e.msg);
        return res.json(result);
      }

        let user: User;
        let err: any;
        [err, user] = await to(this.repository.getUserByResetPasswordToken(request.token));

        if(!user){
            result.errors.push(this.warningMsg);            
        }else if(user.disabled){
            result.errors.push(`Account is disabled`);
        }
        else{
            user.password = await hashPassword(request.password);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.activated = true;
    
            let tmp: any;
            [err, tmp] = await to(this.repository.saveUser(user));
            if (err) {
                result.errors.push(err.message);
            }
            if (!result.errors.length) {
                result.success = true;
                result.sid = handlerUtils.getSessionId(user.guid);
            }            
        }
        return res.json(result);
        
    }
}