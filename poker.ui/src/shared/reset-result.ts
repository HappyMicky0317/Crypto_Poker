export class ResetRequest{
  token:string;
  password: string;
  confirm: string;
}

export class ResetResult{
  success:boolean;
  errors:string[] = [];
  sid:string;
}


