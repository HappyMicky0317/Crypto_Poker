#Use on windows to trigger the tx callback
#walletnotify=PowerShell.exe D:\aaa_development\immediatecashpoker\scripts\transaction.ps1 %s​
$transactionId = $args[0]
(Invoke-WebRequest "http://localhost:8113/dashd-tx-callback?txid=$transactionId" -UseBasicParsing).Content
$transactionId | Out-File -FilePath transactionId.txt -Encoding UTF8