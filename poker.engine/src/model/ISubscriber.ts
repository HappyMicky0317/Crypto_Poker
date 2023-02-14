import { DataContainer } from "../../../poker.ui/src/shared/DataContainer";
import { User } from "./User";

export class ISubscriber{
    send(data: DataContainer|Buffer) : void { throw new Error("Not implemented")};
    user:{ guid: string; screenName: string };
}