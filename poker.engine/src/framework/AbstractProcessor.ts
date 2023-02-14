import PromiseQueue from 'promise-queue-timeout';
import { Logger, getLogger } from "log4js";
const logger:Logger = getLogger();
import { inspect } from 'util' 

export class AbstractProcessor<TMessage, TResult extends IProcessorResult> {
    
    constructor(private tResultType: new () => TResult, private timeoutMs?:number){

    }
    
    private queue = new PromiseQueue(1, Infinity, { timeout: this.timeoutMs || 30000 });    
    handlers: MessageHandlerDict<TMessage, TResult> = { };
    addHandler(handler:IProcessorMessageHandler<TMessage, TResult>){
        this.handlers[handler.typeName] = handler;
      }

    log(message:TMessage){
        logger.info(`${this.constructor.name} ${Object.keys(message)} ${this.getQueueLog()}`);
    }
    getQueueLog() : string{
        return `PendingLength: ${this.queue.getPendingLength()} QueueLength: ${this.queue.getQueueLength()}`;
    }
    sendMessage(message:TMessage): Promise<TResult> {                        
        this.log(message);
        return this.queue.add(()=>{
            return this.handleMessage(message)
            .catch((e:any)=>{                
                let result = new this.tResultType();
                let errStack = '';
                if(e != null && (e.message || e.stack)){
                    errStack = `${e.message} ${e.stack}`
                }else{
                    errStack = e.toString();
                }
                result.error = `error handling message ${inspect(message)}: ${errStack}`;
                logger.error(result.error)
                return result;
            });
        }).catch((err)=>{            
            let result = new this.tResultType();
            result.error = inspect(err) + ' ' + inspect(message);
            logger.error(result.error)
            return result;
        });
      }
    async handleMessage(message: TMessage): Promise<TResult> {
        for (let key in message) {
            let handler = this.handlers[key];
            if (handler != null) {
                return await handler.run(message);
            }
        }
        return Promise.reject('no message handlers for message')
    }
}
interface MessageHandlerDict<TMessage, TResult> {
    [key: string]: IProcessorMessageHandler<TMessage, TResult>;
}
export interface IProcessorMessageHandler<TMessage, TResult> {
    run(message: TMessage): Promise<TResult>;
    typeName:string;
}
export interface IProcessorResult {
    error:string;
}