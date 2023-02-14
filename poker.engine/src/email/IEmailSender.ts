export class IEmailSender {
    sendEmail(to:string, subject:string, html:string, text?:string, fromEmail?:string, bccs?:string[]) : Promise<string>{
        throw new Error("Not implemented");
    }
}

