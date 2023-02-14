import { TableConfig } from "../TableConfig"
import { CurrencyConfig } from "../CurrencyConfig";

const configs: CurrencyConfig[] = [
   { 
    "name" : "dash",
    "minimumWithdrawl" : "0.001",
    "requiredNumberOfConfirmations" : 1,
    "contractAddress" : null,
    "xpub" : "xpub6CmmjyhYz6pwfhuyZFaqqxzFJxzwaWqMEF38K2P6KaimVDV11J3gXLUquu3xMh2BsjTsrNnAcQ3qC2uMH9SG3HXaobvLNNEJZ5Qb5VbNPsm"
},
{

    "name" : "chp",
    "minimumWithdrawl" : "1",
    "exchange" : "hitbtc",
    "requiredNumberOfConfirmations" : 10,
    "contractAddress" : "0xf3db7560E820834658B590C96234c333Cd3D5E5e"
},
{

    "name" : "btc",
    "minimumWithdrawl" : "0.0001",
    "requiredNumberOfConfirmations" : 1,
    "contractAddress" : "",
    "xpub" : "ypub6YAxCsNq3En9toXTqvNBBkSh9RMeJxzpEZ6wB7EVGfXDsgDErYqAk6otTghhPnJ8uifhWQozhzpdiX4MXDnkwWyKf5GDCw7m8vajuKrLZwr"
},
{

    "name" : "eth",
    "minimumWithdrawl" : "0.001",
    "requiredNumberOfConfirmations" : 10,
    "contractAddress" : "",
    "xpub" : "xpub6Csu6uTGx1i2PVx9fdHyhKeZVkL51JFvrSkNPzsMpZXr3Bu7nBY6aVrkzeMeRqpH5GZxfXi3xL4QHQnHbFfLGAVfSKUYeBBUL7Yx3zKvLA6"
},
{

    "name" : "troy",
    "minimumWithdrawl" : "1",
    "doNotPoll" : true,
    "requiredNumberOfConfirmations" : null,
    "contractAddress" : "0x14B35d4Ad91b9eA62c7eF096dDfc0e8403af1A21"
},
{

    "name" : "xmr",
    "minimumWithdrawl" : "0.001",
    "requiredNumberOfConfirmations" : 10,
    "contractAddress" : ""
}

]

export default configs;