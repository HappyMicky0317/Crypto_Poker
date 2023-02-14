export class TableAuditEvent {  
    constructor(public userGuid: string, public action: string, public betAmount: number) {  }
  }