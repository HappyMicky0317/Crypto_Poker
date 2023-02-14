#!/bin/bash
#rm payment_server.zip
#cp /media/secure1/9E3A-E24E/payment_server.zip ./
killall node
rm -rf poker/poker.admin.ui.angular
rm -rf poker/poker.payments/build
unzip -o payment_server.zip -d poker/
OUT=$?
if [ $OUT -eq 0 ];then
   echo "running apps"
   #./check_vpn.sh &
   cd poker/poker.payments/   
   http-server ~/poker/poker.admin.ui.angular/dist -p 4200
   node ./build/poker.payments/src/PaymentProcessorBootstrapper.js
else
   echo "payment_server.zip not found!"
fi

