import sg = require('@sendgrid/mail')
let sendgridOptions:any = {};
sendgridOptions.auth    = {};
sendgridOptions.auth.api_key = process.env.POKER_SENDGRID_API_KEY;         

export function sendEmail(to:string, subject:string, html:string, text?:string, fromEmail?:string, bccs?:string[]) : Promise<string>{
  // Create email
    const msg:any = {        
        bcc:   bccs,
        from:     fromEmail || process.env.POKER_SITE_NAME + ' <' + process.env.POKER_FROM_EMAIL + '>',
        subject:  subject         
      };
      if(to){
        msg.to = to;
      }
      if(html){
        msg.html = html;
      }
      if(text){
        msg.text = text;
      }

      return new Promise((resolve,reject)=>{
        sg.send(msg, false, (err)=>{          
          if(err){
            reject('@sendgrid/mail: ' + err)
          }else{
            resolve('')
          }
        }).catch((err:any)=>{
          reject('@sendgrid/mail: ' + err)
        });
      })
}