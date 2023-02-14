import { IEmailSender } from "./IEmailSender";
import {sendEmail as sendEmailFunc} from "./email-sender";
export class EmailSender implements IEmailSender {
    sendEmail(to: string, subject: string, html: string, text?: string, fromEmail?: string, bccs?: string[]): Promise<string> {
        return sendEmailFunc(to, subject, html, text, fromEmail, bccs);
    }
}