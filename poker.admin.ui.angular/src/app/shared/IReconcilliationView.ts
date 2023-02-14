export interface IReconcilliationView {
    timestamp:Date;
    wallets:WalletSummaryView[];
    reconcilliations:any[];//UserReconcilliationResult
  }

export interface WalletSummaryView {
    currency:string;
    walletBalance?:string;
    walletFetchError?:string;
    accountBalanceTotal?:number;
    rakeTotal?:number;
    sweepTotal?:number;
    expectedWalletBalance?:number;  
    difference?:number;  
    seedAmount?:number;  
  }

  