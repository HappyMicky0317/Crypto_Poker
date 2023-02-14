$folderName = $((Get-Date).ToString('yyyyMMdd'))
plink -batch -pw $env:poker_server_pass $env:poker_server_location rm -rf database_backup
plink -batch -pw $env:poker_server_pass $env:poker_server_location rm -rf db_*.zip
plink -batch -pw $env:poker_server_pass $env:poker_server_location mongodump -d PokerGameServer -o ~/database_backup
plink -batch -pw $env:poker_server_pass $env:poker_server_location zip -rj db_$folderName.zip ~/database_backup/PokerGameServer/*.*
$fullPath = "..\db_backup\$folderName"
New-Item -ItemType Directory -Path $fullPath
pscp -batch -pw $env:poker_server_pass ${env:poker_server_location}:./db_$folderName.zip $fullPath
cd $fullPath\
7z x db_$folderName.zip
$dbName = "PokerGameServerProd" + $folderName
mongorestore -d $dbName .
$dbName