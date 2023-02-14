import protobufConfig from './../../poker.ui/src/shared/protobuf-config';
import { ISubscriber } from './model/ISubscriber';
import {  DataContainer } from "../../poker.ui/src/shared/DataContainer";
export function broadcast(clients:ISubscriber[], data:DataContainer, excludeGuid?:string):void {
    let buffer = protobufConfig.serialize(data, 'DataContainer');
    for(let client of clients){
      if(!excludeGuid || client.user.guid !== excludeGuid){
        client.send(buffer);
      }
    }    
  }