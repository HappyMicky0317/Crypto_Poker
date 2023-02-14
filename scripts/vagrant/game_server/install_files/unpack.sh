#!/bin/bash
unzip -o poker_game_server.zip -d poker/
mv poker/poker.ui/* /var/www/poker.site/
mv poker/poker.admin.ui.angular/dist/* /var/www/admin.poker.site/