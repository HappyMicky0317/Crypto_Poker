import { PlayerTableHandle } from "./PlayerTableHandle";
import { Table } from "../../table";

export class PostShowdownEvent{
  
    handled:boolean;
    bustedPlayers:PlayerTableHandle[];
  
    constructor(public table:Table){
  
    }
}