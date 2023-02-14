"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailchimpService = void 0;
const CommonHelpers_1 = __importDefault(require("../../../poker.ui/src/shared/CommonHelpers"));
const log4js_1 = require("log4js");
const Http_1 = require("./Http");
var logger = (0, log4js_1.getLogger)();
const http = new Http_1.Http();
class MailchimpService {
    async addSubscriber(email) {
        if (!process.env.POKER_MAILCHIMP_API_KEY) {
            logger.info(` cannot addSubscriber. POKER_MAILCHIMP_API_KEY not defined`);
            return;
        }
        if (!process.env.POKER_MAILCHIMP_LIST_ID) {
            logger.info(` cannot addSubscriber. POKER_MAILCHIMP_LIST_ID not defined`);
            return;
        }
        let listUniqueId = process.env.POKER_MAILCHIMP_LIST_ID;
        let post_data = {
            'email_address': email,
            'status': 'subscribed'
        };
        let path = `lists/${listUniqueId}/members/`;
        let [err, data] = await (0, CommonHelpers_1.default)(this.post(post_data, path, 'POST'));
        if (err) {
            logger.warn('MailchimpService.addSubscriber failed:', err.stack);
        }
    }
    async sendTemplateToSubscribers(subject, content, templateId) {
        var listId = process.env.POKER_MAILCHIMP_LIST_ID;
        let settings = {
            subject_line: subject,
            reply_to: process.env.POKER_FROM_EMAIL,
            from_name: process.env.POKER_SITE_NAME
        };
        let campaignId = await this.createCampaign(settings, listId);
        let html = await this.getHtmlFromDragAndDropTemplate(templateId);
        let index = html.indexOf('${content}');
        if (index < 0) {
            throw new Error(`could not find placeholder in content`);
        }
        var contentRequest = {
            html: html.replace('${content}', content)
        };
        await this.setCampaignContent(campaignId, contentRequest);
        let [err, result] = await (0, CommonHelpers_1.default)(this.post(null, `campaigns/${campaignId}/actions/send`, 'POST'));
    }
    async post(post_data, path, method) {
        let mailchimpApiKey = process.env.POKER_MAILCHIMP_API_KEY;
        let mailchimpInstance = mailchimpApiKey.substring(mailchimpApiKey.indexOf('-') + 1);
        let url = `https://${mailchimpInstance}.api.mailchimp.com/3.0/${path}`;
        var options = {
            headers: {
                "Authorization": 'Basic ' + new Buffer('any:' + mailchimpApiKey).toString('base64')
            }
        };
        if (method === 'POST' || method === 'PUT') {
            options.body = post_data;
        }
        return http.get(url, options);
    }
    async createCampaign(settings, listId) {
        let campaign = {};
        if (listId) {
            campaign.recipients = { list_id: listId };
        }
        if (settings) {
            campaign.settings = settings;
        }
        campaign.type = 'regular';
        let path = `/campaigns`;
        let [err, result] = await (0, CommonHelpers_1.default)(this.post(campaign, path, 'POST'));
        return result.id;
    }
    async getHtmlFromDragAndDropTemplate(templateId) {
        let campaignId = await this.createCampaign(null, null);
        var contentRequest = {};
        contentRequest.template = { id: templateId };
        await this.setCampaignContent(campaignId, contentRequest);
        let [err2, r2] = await (0, CommonHelpers_1.default)(this.post(null, `campaigns/${campaignId}/content`, 'GET'));
        let [err3, r3] = await (0, CommonHelpers_1.default)(this.post(null, `campaigns/${campaignId}`, 'DELETE'));
        return r2.html;
    }
    async setCampaignContent(campaignId, contentRequest) {
        let [err1, r1] = await (0, CommonHelpers_1.default)(this.post(contentRequest, `campaigns/${campaignId}/content`, 'PUT'));
    }
}
exports.MailchimpService = MailchimpService;
//# sourceMappingURL=MailchimpService.js.map