import { RegisterRequest, RegisterResult } from './../../../poker.ui/src/shared/signup-request';
import { IMessageHandler } from "../poker-processor";
import { WebSocketHandle } from "../model/WebSocketHandle";
import { AbstractMessageHandler } from './AbstractMessageHandler';
import { IDataRepository } from '../services/documents/IDataRepository';
import { IBroadcastService } from '../services/IBroadcastService';
import * as userValidation from '../services/user-validation';
import { DataContainer,Account  } from '../../../poker.ui/src/shared/DataContainer';
import { Currency } from '../../../poker.ui/src/shared/Currency';
import { User } from '../model/User';
var validator = require('validator');
import { hashPassword, getGravatar } from '../helpers';
import { randomBytesHex, to } from '../shared-helpers';
import config from '../config';
import { sendStandardTemplateEmail } from '../email-helpers';
import { MailchimpService } from '../services/MailchimpService';
var logger = require('log4js').getLogger();


export class RegisterRequestHandler  extends AbstractMessageHandler<RegisterRequest> {
    
    constructor(private dataRepository: IDataRepository) {
        super();
    }

    async handleMessage(wsHandle: WebSocketHandle, request: RegisterRequest): Promise<void> {

        let registerResult:RegisterResult = new RegisterResult();
        
        let screenNameValidationResult = await userValidation.validateScreenName(request.screenName, wsHandle.user.guid, this.dataRepository);
        if (!screenNameValidationResult.success) {
            registerResult.errorMessage = screenNameValidationResult.errorMessage;
        }
        if(!request.password || request.password.length < 4){
            registerResult.errorMessage = 'Your password must be at least 4 characters long.';
        }
        if(request.password !== request.confirmPassword){
            registerResult.errorMessage = 'Your passwords do not match.';
        }
        
        let email = request.email ? request.email.trim() : '';
        if(!validator.isEmail(email)){
            registerResult.errorMessage = 'Invalid email';
        }
        
        let existingUser = await this.dataRepository.getUserByEmail(email);        
        if(existingUser){
            registerResult.errorMessage = 'Your email address is already registered. Please use the reset password feature if you have forgotten your password';
        }
        
        
        let success = registerResult.errorMessage==undefined;
        if(success){
            if(existingUser == null){
                let userWithScreenName = (await this.dataRepository.getUsersByScreenName(request.screenName))[0];
                let user:User;
                if(!userWithScreenName){
                    user = new User();
                    user.guid = await randomBytesHex();
                    user.screenName = request.screenName;
                    user.updateIndex = 0;
                }else{
                    user = userWithScreenName;//screenName already in db due to user changing their screenName as anon
                }                
                
                user.email = email;
                user.gravatar = await getGravatar(user.email);
                user.password = await hashPassword(request.password);
                user.activationToken = await randomBytesHex();
                await this.dataRepository.saveUser(user);
                let [err,data] = await to(this.sendActivationEmail(user.email, user.activationToken, user.screenName, request.tournamentId));
                if(err){                    
                    await this.dataRepository.deleteUser(user.guid);
                    registerResult.errorMessage = 'Email error';
                    success = false;
                    logger.error('sendActivationEmail', err);
                }else{
                    new MailchimpService().addSubscriber(email);//do not await
                }
            }else{                
                //let details = '<p>Your email address is already registered. Please use the reset password feature if you have forgotten your password</p>';
                //let [err,data] = await to(sendStandardTemplateEmail(email, 'Activate your new account', details));
            }
                        
        }
        
        let dc = new DataContainer();
        registerResult.success = success;
        dc.registerResult = registerResult;
        wsHandle.send(dc);        
    }



    async sendActivationEmail(email: string, activationToken:string, screenName:string, tournamentId:string): Promise<void> {
        let tournamentIdParam = tournamentId ? `&tournamentId=${tournamentId}`:'';
        let activationLink = `http://3.126.18.118:9000/?token=${activationToken}${tournamentIdParam}#/activate`;
        let details = `<p>Hello ${screenName}!</p>`+
                                    `<p>Welcome to ${process.env.POKER_SITE_NAME}!  Here is a link to activate your new account:</p>`
                                    +`<p><a href="${activationLink}">Activate my account</a></p>`;

        
        let subject = 'Activate your new account';
        await sendStandardTemplateEmail(email, subject, details);
    }

    
}
