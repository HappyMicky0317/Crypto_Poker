import { ForgotResult } from './../../../poker.ui/src/shared/forgot-request';
import { AbstractMessageHandler } from "./AbstractMessageHandler";
import { IDataRepository } from "../services/documents/IDataRepository";
import { ForgotRequest } from "../../../poker.ui/src/shared/forgot-request";
import { WebSocketHandle } from "../model/WebSocketHandle";
import { DataContainer } from "../../../poker.ui/src/shared/DataContainer";
import { randomBytesHex, to } from '../shared-helpers';
import config from '../config';
import { User } from '../model/User';
import { sendStandardTemplateEmail } from '../email-helpers';
var logger = require('log4js').getLogger();

export class ForgotRequestHandler extends AbstractMessageHandler<ForgotRequest>{
    constructor(private dataRepository: IDataRepository) {
        super();
    }

    async handleMessage(wsHandle: WebSocketHandle, request:ForgotRequest): Promise<any>{
        let result:ForgotResult = new ForgotResult();

        if(!request.email ){
            result.errors.push('Please enter a valid email address.');
        }else{
            let user = await this.dataRepository.getUserByEmail(request.email.trim());
            if(!user || user.disabled){
                result.errors.push('Hmmm... is that your correct email address?');
            }else{
                await this.sendResetEmail(user, result);
            }
        }

        let data = new DataContainer();
        data.forgotResult = result;
        wsHandle.send(data);
    }

    async sendResetEmail(user:User, result:ForgotResult){
        var hour = 3600000;
        var expiration = (hour * 4);                
        user.resetPasswordToken = await randomBytesHex();
        user.resetPasswordExpires = Date.now() + expiration;
        await this.dataRepository.saveUser(user);

        let resetLink = `${config.baseAddress}/?token=${user.resetPasswordToken}#/reset`;
        let details = `<p>Hello ${user.screenName}!</p>`+
                            `<p>Here is a special link that will allow you to reset your password.  Please note it will expire in four hours for your protection:</p>`
                            +`<p><a href="${resetLink}">Reset Your Password </a></p>`;

        let [err,data] = await to(sendStandardTemplateEmail(user.email, `Reset your ${process.env.POKER_SITE_NAME} password`, details));
        if(!err){
            result.success = true;
            result.message = 'We sent you an email with further instructions. Check your email!';
        }else{
            logger.error(err);
        }
    }
}


