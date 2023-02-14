import { DashTxController } from "../../src/webserver/dash-tx.controller";
import { ISubstitute } from "../../../poker.engine/test/shared-test-helpers";
import { ISecureDataRepository } from "../../src/repository/ISecureDataRepository";
import { PaymentProcessor } from "../../src/processor/PaymentProcessor";
import { DashCoreBlockService } from "../../src/services/DashCoreBlockService";
import * as assert from 'assert';
import { Substitute, default as substitute } from 'jssubstitute';
import { CurrencyConfig, AddressSmall } from "../../src/model/currency-config";
import { AddressInfo } from "../../src/model/AddressInfo";
import { PaymentProcessorMessage } from "../../src/processor/PaymentProcessorMessage";

describe('DashTxControllerFixture', () => {
    let dashCoreBlockService: ISubstitute<DashCoreBlockService>;
    let paymentProcessor: ISubstitute<PaymentProcessor>;
    let controller:DashTxController;
    let repository: ISubstitute<ISecureDataRepository>;

    beforeEach(()=>{
        repository = <any>substitute.for(new ISecureDataRepository);
        let currencyConfig = new CurrencyConfig();
        currencyConfig.requiredNumberOfConfirmations = 1
        currencyConfig.masterAccount = new AddressSmall()
        currencyConfig.masterAccount.public = "XbsstQWzgrS4qQp81ojm7bCs9oaESoYrM6";
        repository.getCurrencyConfig = (currency:string) => Promise.resolve(currencyConfig);        
        paymentProcessor= <any>substitute.for({ sendMessage: ()=> { }});                
        dashCoreBlockService = <any>substitute.for(new DashCoreBlockService(repository));        
        controller = new DashTxController(repository, paymentProcessor, dashCoreBlockService);
        controller.logJson = false;
    })

    it('payments to master account are ignored', async ()=>{
        
        let json = JSON.parse('{"result":{"amount":-0.04999771,"fee":-0.00000229,"confirmations":1,"instantlock":false,"blockhash":"00000000000000247ac314e6394ef4016cb15326e30ed6d4e3c8f1911749391e","blockindex":28,"blocktime":1538657499,"txid":"5c15fdfc177d7adba428e8e80f29e2bec55ecd488148d20f225be65195b56984","walletconflicts":[],"time":1538657340,"timereceived":1538657340,"bip125-replaceable":"no","details":[{"involvesWatchonly":true,"account":"","address":"XvavtmzGtWat3BznGry2SEMCqWUQtjZ6nW","category":"send","amount":-0.04999771,"vout":0,"fee":-0.00000229,"abandoned":false},{"involvesWatchonly":true,"account":"","address":"XbsstQWzgrS4qQp81ojm7bCs9oaESoYrM6","category":"send","amount":-0.05,"label":"","vout":1,"fee":-0.00000229,"abandoned":false},{"involvesWatchonly":true,"account":"","address":"XbsstQWzgrS4qQp81ojm7bCs9oaESoYrM6","category":"receive","amount":0.05,"label":"","vout":1}],"hex":"0100000001dd8f8e09d9483146bca1deed63a61d2c9421ef9c3c4090f8a1c4d671d077ac26010000006b483045022100fa27eb00282b41923b7a5365d7c1dd2e244f9725a936bea1cdf3e9d7f4352db6022042f7fdce80cc58d958afd5c1c5521a6f1dba332860c4286a28f44ab313d25c5d012102a436d4dd4bf38bf0c3edfacbf030c92be0a71a65431bc36ac9db7b2c61997024ffffffff025b4a4c00000000001976a914da443e90eed93ecf74a963bdf46b6446f32d781d88ac404b4c00000000001976a9140d0e6a8fc1135e3e1e114a4f1eeb8394587ec4bf88ac00000000"},"error":null,"id":null}');
        dashCoreBlockService.returns('getTransaction', Promise.resolve(json));

        const [warnings, info] = await controller.run(json.result.txid)
        
        assert.equal(warnings.length, 0, warnings.join())
        assert.equal(info[0], 'received credit to master account XbsstQWzgrS4qQp81ojm7bCs9oaESoYrM6 of 0.05 confirmations:1 txid:5c15fdfc177d7adba428e8e80f29e2bec55ecd488148d20f225be65195b56984')
        paymentProcessor.didNotReceive('sendMessage')
    })


    it('tx is sent to PaymentProcessor', async ()=>{
        repository.getAddressInfoByAddress = (address:string) => Promise.resolve(new AddressInfo());
        let json = JSON.parse('{"result":{"amount":0.1,"confirmations":1,"instantlock":true,"blockhash":"000000000000003b95e8466756b3883bd672bf06ff624f5cd39baeeea73e0e5b","blockindex":1,"blocktime":1538654783,"txid":"26ac77d071d6c4a1f890403c9cef21942c1da663eddea1bc463148d9098e8fdd","walletconflicts":[],"time":1538654713,"timereceived":1538654713,"bip125-replaceable":"no","details":[{"involvesWatchonly":true,"account":"cold m/0/1","address":"XpkYdHNjkKVJAhdrYJRmjgaLY9z78TA13d","category":"receive","amount":0.1,"label":"cold m/0/1","vout":1}],"hex":"02000000034ac423a7bd985a82ca052f78d2244e3ee709a59cc10f7da118cd8c2b4ce82647000000006a4730440220544f145a9345363964b7c465e726f5d738e2b22310691e9a275db2ab2725edce02207040659fe7ef46a9a080ba9cd6f5c698b805d2ef513a1f87c13f98815b47bce4012103cc74ecdb9f6baf6be7b4f4d99df84873dd33ad171e6e3a026ac7b3b4ab25edb6feffffff9f00a0290b3005166ff8e498f73e24466878f9589d612f9ff479c75e2f390cdc080000006a473044022010bfd13bb2cf89b2c85a0ec1b94b4b66a78f9131d92a57e4a20d5512541050f2022064b211cc5d31372d86a415e74eb1b3a178ca970a154319154a7257cf568d0e72012102d55facfa9d927e6680c09281e8bf9eb8ff68f1047ed9c53cb43fa8bcfa342280feffffff13aef85b333e3abf4c725cf6445a34f02c0cda22f60e1a3913b1badb97dcccf9060000006a47304402207d92418c3e1f44f894a3695faa7212e301846a20986cf0f9e298853bb25a9b2d022071f3cbafab2d33756ab99752cc9ae8b82a31feb4ad261971b7ac01d488123a15012103d13d6ff310fc61afe4551e76ab00132ad07109be530d797ca22ddd8fec2cb584feffffff02fee71400000000001976a91451de9c746db90bc3bb2f5076e9986b2e61fa3a4d88ac80969800000000001976a9149a450fc882ca43bcba82c2f9201dd7da1ac7c67688ac06780e00"},"error":null,"id":null}');
        dashCoreBlockService.returns('getTransaction', Promise.resolve(json));
        

        const [warnings, info] = await controller.run(json.result.txid)
        
        assert.equal(warnings.length, 0, warnings.join())
        assert.equal(info.length, 0, info.join())        
        let args = <PaymentProcessorMessage>paymentProcessor.argsForCall('sendMessage', 0)[0];        
        assert.equal(args.incomingPaymentEvent.amount, 10000000);
        assert.equal(args.incomingPaymentEvent.instantlock, true);
        assert.equal(args.incomingPaymentEvent.confirmations, 1);
    })

    


})