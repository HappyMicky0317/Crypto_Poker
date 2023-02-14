export class RegisterRequest{
  screenName:string;
  email:string;
  password:string;
  confirmPassword:string;
  tournamentId: string;
}
export class RegisterResult {
  success:boolean;
  message:string;
  errorMessage:string;
}
