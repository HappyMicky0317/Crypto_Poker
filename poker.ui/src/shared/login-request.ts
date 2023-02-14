export class LoginRequest{  
  constructor(public email:string, public password:string) {
    
  }
}
export class LoginResult{
  success:boolean;
  errorMessage:string;
  sid:string;;    
}
export class LogoutRequest{

}
export class LogoutResult{
  
}
