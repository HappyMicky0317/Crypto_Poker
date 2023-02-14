export class Admin{    
    name: string = undefined;
    picture : string = undefined;
    email: string = undefined;
    password: string = undefined;
    is_super?: {type : boolean, default : false}
  }