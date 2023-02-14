export class IDepositAddressService {
    getAddress(currency:string, xpub:string, index:number) : Promise<string> {
        throw new Error("Not implemented");
    }
}