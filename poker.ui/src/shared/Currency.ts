export class Currency {
    public static free: string = 'usd';
    public static dash: string = 'dash';
    public static bcy: string = 'bcy';
    public static eth: string = 'eth';
    public static beth: string = 'beth';
    public static btc: string = 'btc';  
    public static tournament: string = 'tournament';    
  
    public static freeStartingAmount: number = 100000;
  }

  export class CurrencyUnit {
    public static free: number = 100;
    public static dash: number = 100000000;
    public static bcy: number = 100000000;
    //public static eth: number = 1000000000000000000;
    public static eth: number = 100000000;
    public static btc: number = 100000000;
    public static default: number = 100000000;
  
    public static getCurrencyUnit(currency: string): number {
      if (currency === Currency.free)
        return CurrencyUnit.free;
      else if (currency === Currency.tournament)
        return 1;
      else
        return 100000000;    
    }
  }