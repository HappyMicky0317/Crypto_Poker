import to from "../../../poker.ui/src/shared/CommonHelpers";
import { Logger, getLogger } from "log4js";
import { Http } from "./Http";
import { IHttpOptions } from "./IHttp";
var logger:Logger = getLogger();

const http = new Http();

export class MailchimpService {
    

    async addSubscriber(email: string): Promise<void> {
        if(!process.env.POKER_MAILCHIMP_API_KEY){
            logger.info(` cannot addSubscriber. POKER_MAILCHIMP_API_KEY not defined`)
            return;
        }
        if(!process.env.POKER_MAILCHIMP_LIST_ID){
            logger.info(` cannot addSubscriber. POKER_MAILCHIMP_LIST_ID not defined`)
            return;
        }
        let listUniqueId: string = process.env.POKER_MAILCHIMP_LIST_ID;
        let post_data = {
            'email_address': email,
            'status': 'subscribed'           
        };
        let path = `lists/${listUniqueId}/members/`;
        let [err, data] = await to(this.post(post_data, path, 'POST'));

        if(err){
            logger.warn('MailchimpService.addSubscriber failed:', err.stack);
        }
    }

    async sendTemplateToSubscribers(subject:string, content:string, templateId:number){
        
        var listId = process.env.POKER_MAILCHIMP_LIST_ID;
        let settings = {
            subject_line : subject,
            reply_to : process.env.POKER_FROM_EMAIL,
            from_name : process.env.POKER_SITE_NAME
        }
        
        let campaignId:string = await this.createCampaign(settings, listId);

        //let [err, data] = await to(this.post(null, `templates/${templateId}/default-content`, 'GET'));
        let html = await this.getHtmlFromDragAndDropTemplate(templateId);
        //console.log(html);
        let index = html.indexOf('${content}');
        if(index < 0){
            throw new Error(`could not find placeholder in content`);
        }
        var contentRequest = {
            html: html.replace('${content}', content)
        };
        await this.setCampaignContent(campaignId, contentRequest);
        let [err, result] = await to(this.post(null, `campaigns/${campaignId}/actions/send`, 'POST'));
        //console.log('send result', result);
        //string campaignId = result.Id;
    }

    async post(post_data:any, path:string, method:string) : Promise<any> {
        let mailchimpApiKey: string = process.env.POKER_MAILCHIMP_API_KEY;
        let mailchimpInstance = mailchimpApiKey.substring(mailchimpApiKey.indexOf('-')+1);
        let url = `https://${mailchimpInstance}.api.mailchimp.com/3.0/${path}`;
        
        var options:IHttpOptions = {                              
            headers: {
                "Authorization": 'Basic ' + new Buffer('any:' + mailchimpApiKey).toString('base64')
            }            
        };
        if(method === 'POST' || method === 'PUT'){
            options.body = post_data;
        }

        return http.get(url, options);        
    }

    async createCampaign(settings:any, listId?:string) : Promise<string> {
        let campaign:any = { };
        if(listId){
            campaign.recipients =  {list_id : listId};
        }
        if(settings){
            campaign.settings = settings;
        }
        
        campaign.type = 'regular';
        
        let path = `/campaigns`;
        let [err, result] = await to(this.post(campaign, path, 'POST'));
        return result.id;
    }



    private async getHtmlFromDragAndDropTemplate(templateId:number) : Promise<string>    {
        let campaignId:string = await this.createCampaign(null, null);
        //let campaignId = 'cc02697455';
        var contentRequest:any= { };
         contentRequest.template =  { id : templateId };
         await this.setCampaignContent(campaignId, contentRequest);
         
        // var r2 = await manager.Content.GetAsync(campaignId);
        let [err2, r2] = await to(this.post(null, `campaigns/${campaignId}/content`, 'GET'));
        let [err3, r3] = await to(this.post(null, `campaigns/${campaignId}`, 'DELETE'));
        return r2.html;        
    }

    private async setCampaignContent(campaignId:any, contentRequest:any){
        let [err1, r1] = await to(this.post(contentRequest, `campaigns/${campaignId}/content`, 'PUT'));
    }
}