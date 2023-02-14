#!/bin/bash +x
  while [ "true" ]
   do
        CON="nl68.nordvpn.com.tcp"
        STATUS=`nmcli con show --active | grep $CON | cut -f1 -d " "`
        if [ -z "$STATUS" ]; then
                echo "Disconnected, trying to reconnect..."
                (sleep 1s && nmcli con up $CON)
        else
                echo "Already connected !"
        fi
        sleep 30
   done
