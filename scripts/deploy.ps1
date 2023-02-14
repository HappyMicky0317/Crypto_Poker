if (-not [Environment]::GetEnvironmentVariable('poker_server_pass'))
{
    Write-Host "poker_server_pass not defined"
	exit
}
if (-not [Environment]::GetEnvironmentVariable('poker_server_location'))
{
    Write-Host "poker_server_location not defined. should be format user@foo.com"
	exit
}
if (-not [Environment]::GetEnvironmentVariable('poker_server_cdn'))
{
    Write-Host "poker_server_cdn not defined. should be format https://foo.com without the trailing slash"
	exit
}
Write-Host "starting build"
git reset --hard
git pull
git checkout -- .
git rev-parse --short HEAD | Out-File -FilePath .version -Encoding UTF8
$cdn = [Environment]::GetEnvironmentVariable('poker_server_cdn')
$version = Get-Content .version

(Get-Content .\poker.ui\src\style.scss).replace("`$cdn: '';", "`$cdn: '${cdn}/';") | Set-Content .\poker.ui\src\style.scss
(Get-Content .\poker.ui\src\cards.scss).replace("`$cdn: '';", "`$cdn: '${cdn}/';") | Set-Content .\poker.ui\src\cards.scss
(Get-Content .\poker.ui\src\flags16.scss).replace("`$cdn: '';", "`$cdn: '${cdn}/';") | Set-Content .\poker.ui\src\flags16.scss



cd poker.ui\
dir scripts\*.js -Recurse | Remove-Item
npm install
au build --env prod

Write-Host "Renaming bundled files..."
mv .\scripts\app-bundle.js .\scripts\app-bundle-$version.js
mv .\scripts\vendor-bundle.js .\scripts\vendor-bundle-$version.js
(Get-Content index.html).replace('scripts/vendor-bundle.js', "$cdn/scripts/vendor-bundle-$version.js") | Set-Content index.html
(Get-Content index.html).replace('http://localhost:9000', $cdn) | Set-Content index.html
(Get-Content "./scripts/vendor-bundle-$version.js").replace('../scripts/app-bundle', "$cdn/scripts/app-bundle-${version}") | Set-Content "./scripts/vendor-bundle-$version.js"

cd ../poker.engine
Remove-Item -Recurse -Force build/
npm install
(Get-Content src/environment.ts).replace('debug: true', "debug: false") | Set-Content src/environment.ts
tsc
if($LASTEXITCODE -ne 0)
{
    Write-Host "ERROR! poker.engine tsc failed! $LASTEXITCODE" 
	exit
}
Write-Host "tsc completed successfully" 
cd ..


Write-Host "Creating payment server zip" 
.\scripts\create_payments_server_package.ps1 -pull:0

(Get-Content ./poker.admin.ui.angular/dist/main.js).replace('var isPaymentServer = true;', "var isPaymentServer = false;") | Set-Content ./poker.admin.ui.angular/dist/main.js
$zipFile = "poker_game_server.zip"
Write-Host "Creating $zipFile" 
.\scripts\create_zip.ps1 $zipFile


Write-Host "Stopping remote process and cleaning folders" 
plink -no-antispoof -pw $env:poker_server_pass $env:poker_server_location ./clean.sh

Write-Host "Uploading zip" 
pscp -pw $env:poker_server_pass $zipFile ${env:poker_server_location}:.

Write-Host "Unpacking zip" 
pscp -no-antispoof -pw $env:poker_server_pass scripts\unpack.sh ${env:poker_server_location}:.
plink -no-antispoof -pw $env:poker_server_pass $env:poker_server_location chmod +x ./unpack.sh
plink -no-antispoof -pw $env:poker_server_pass $env:poker_server_location ./unpack.sh

Write-Host "Running app" 
plink -no-antispoof -pw $env:poker_server_pass $env:poker_server_location ./run.sh
git show --summary




