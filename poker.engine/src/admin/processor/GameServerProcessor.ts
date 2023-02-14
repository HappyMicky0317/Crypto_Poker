import { AbstractProcessor, IProcessorMessageHandler } from "../../framework/AbstractProcessor";
import { GameServerProcessorMessage } from "./GameServerProcessorMessage";
import { GameServerProcessorResult } from "./GameServerProcessorResult";

export class GameServerProcessor extends AbstractProcessor<GameServerProcessorMessage,GameServerProcessorResult> {
    
    constructor(){
        super(GameServerProcessorResult)
    }
}
export interface IGameServerProcessorMessageHandler extends IProcessorMessageHandler<GameServerProcessorMessage,GameServerProcessorResult> {
    
}