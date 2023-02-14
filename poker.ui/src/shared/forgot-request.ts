export class ForgotRequest{
  email:string
}

export class ForgotResult{
  success:boolean;
  message:string;
  errors:string[] = [];
}
