import { IDataRepository } from "./documents/IDataRepository";
import { User } from "../model/User";

export async function validateScreenName(screenName: string, userGuid: string, dataRepository: IDataRepository): Promise<ScreenNameValidationResult> {
    let result = new ScreenNameValidationResult();
    screenName = screenName ? screenName.trim() : '';
    if (screenName.length <= 2) {
        result.errorMessage = "Screen name too short. Must be at least 3 characters";
    } else if (screenName.length > 10) {
        result.errorMessage = "Screen name too long. Must be 10 characters or less";
    } else if (screenName.toLowerCase().startsWith('dealer')) {
        result.errorMessage = "Invalid screen name. Cannot start with 'Dealer'";
    }

    let users: User[] = await dataRepository.getUsersByScreenName(screenName);
    if (users.filter(u => u.guid !== userGuid).length) {
        result.errorMessage = "User exists with this screen name. Please choose a unique screen name.";
      }

    result.success = !result.errorMessage;
    result.screenName = screenName;
    return Promise.resolve(result);
}

export class ScreenNameValidationResult {
    success: boolean;
    screenName: string;
    errorMessage: string;
}