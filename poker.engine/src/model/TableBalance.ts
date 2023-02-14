export class TableBalance {

  constructor(public tableId: string, public currency: string) {  }
  accounts: UserTableAccount[] = [];
}

export class UserTableAccount { 
  constructor(public userGuid: string, public screenName: string, public balance: number) {  }
}