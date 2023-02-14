param (
    [int]$pull = 1
 )
if($pull){
git pull
git checkout master
git rev-parse --short HEAD | Out-File -FilePath .version -Encoding UTF8
 }
 

 cd .\poker.admin.ui.angular\
 dir dist\*.* -Recurse | Remove-Item
npm i
npm run build:prod

cd ../poker.payments
(Get-Content src/environment.ts).replace('debug: true', "debug: false") | Set-Content src/environment.ts
npm i
tsc
cd ..
copy .version poker.payments/build/poker.payments/src/
Write-Host "Creating payment_server.zip" 
 $zipFile = "payment_server.zip"
 del .\$zipFile
 del E:\$zipFile
7z a $zipFile poker.admin.ui.angular/dist/
7z a $zipFile poker.payments/package.json
7z a $zipFile poker.payments/build/
copy $zipFile E:\
git show --summary





