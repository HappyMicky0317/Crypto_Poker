param (
    [string]$zipName
 )
del .\$zipName
7z a $zipName poker.ui/*.html
7z a $zipName poker.ui/favicon.ico
7z a $zipName poker.ui/images/
7z a $zipName poker.ui/scripts/
7z a $zipName poker.ui/sounds/

7z a $zipName poker.admin.ui.angular/dist/*

copy .version poker.engine/build/poker.engine/src/
copy poker.engine/src/email/standard_template.html poker.engine/build/poker.engine/src/email/
7z a $zipName poker.engine/package.json
7z a $zipName poker.engine/build/



