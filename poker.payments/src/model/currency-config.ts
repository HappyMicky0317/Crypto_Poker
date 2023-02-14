export class CurrencyConfig {
  _id: string;
  name: string;
  requiredNumberOfConfirmations: number;
  masterAccount: AddressSmall;
  sweepAccount: AddressSmall;
  masterSeedAmount: string;
  gasPriceGwei: number;
  gasLimit: number;
  minimumDeposit: string;
  minimumWithdrawl: string;
  contractAddress: string;
  exchange: string;
  doNotPoll: boolean;
  xpub:string;    
  processingDelayMin: number;
  withdrawlLimitPerMin: number;
  withdrawlLimitNumber: number;
  flagAmount: string;
  withdrawlFee: string;
}
export class AddressSmall {
  public: string;
  private: string;
  wif: string;
}
