import { sendEmail } from './email/email-sender';
import environment from './environment';
var fs = require('fs');

export async function sendStandardTemplateEmail(email:string, subject:string, details:string){     
    await sendEmail(email, subject, await getStandardTemplateEmail(details));
}
export async function getStandardTemplateEmail(details:string) : Promise<string> {
    const templateName = 'standard_template.html';
    const filename = `${__dirname}/email/${templateName}`;
    
    if (!fs.existsSync(filename)) {                
        const source = `${__dirname}/../../../src/email/${templateName}`;
        await copySync(source, filename)
    }
    
    if (!fs.existsSync(filename)) {        
        console.error(`could not find ${filename}`)
    }
    let html = fs.readFileSync(filename, 'utf8');
    html = html.replace('{details}', details);
    html = html.replace(/{poker_site_name}/g, process.env.POKER_SITE_NAME);    
    html = html.replace('{year}', new Date().getFullYear());
    html = html.replace('{cdn}', process.env.POKER_CDN);
    return html;
}

function copySync(source:string, dest:string):Promise<void> {
    return new Promise((resolve, reject)=>{
        fs.copyFile(source, dest, (err:any) => {
            if (err){
                reject(err)
            }      
            resolve()     
          });
    })
}