export class EventHook {
  id: string;
  url:string;
  callback_errors:number;
  address:string;
  event:string;
  confirmations: number;
  result: EventHookResult;
}
export class EventHookResult {

  constructor(public confirmations: number, public value: number) {  }
}