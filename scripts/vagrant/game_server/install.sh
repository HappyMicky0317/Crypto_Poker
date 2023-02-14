#!/bin/bash

USER=troy

#add user
useradd -u 1002 -s /bin/bash -m -p $(openssl passwd -1 fred) $USER 
usermod -aG sudo $USER
usermod -aG www-data $USER
#update password afterwards using command 'passwd'

#enable PasswordAuthentication
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config; 

#disable root login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/g' /etc/ssh/sshd_config; 
systemctl restart sshd;

#things missing from base install
apt update
apt upgrade -y
apt-get install software-properties-common curl -y

#letsencrypt
add-apt-repository ppa:certbot/certbot -y

#nodejs
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

#apt-get update not required as nodejs setup script above calls it
service apache2 stop
apt-get remove apache2 -y
apt-get install ufw unzip zip ntp git fail2ban build-essential nginx python-certbot-nginx nodejs -y

#configure firewall
ufw allow 22
ufw --force enable
ufw allow 'Nginx Full'
ufw status verbose

#install forever
npm install forever -g

#mongodb
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb.list
apt update
apt install libcurl3 openssl mongodb-org -y

service mongod start
systemctl enable mongod.service

sudo -u $USER cp /tmp/install_files/*.sh /home/$USER
chmod +x /home/$USER/*.sh

#setup websites
cp /tmp/install_files/poker_site_nginx /etc/nginx/sites-available/
cp /tmp/install_files/admin_site_nginx /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/poker_site_nginx /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/admin_site_nginx /etc/nginx/sites-enabled/

nginx -t

cp /tmp/install_files/.htpasswd /etc/nginx/

mkdir -p /opt/poker/poker.engine
tar -xvf /tmp/install_files/GeoLite2-Country.tar.gz -C /opt/poker/poker.engine --wildcards "*.mmdb" --strip-components 1

cp /tmp/install_files/game_server.env /home/$USER/poker/poker.engine/.env

mkdir -p /var/www/poker.site
mkdir -p /var/www/admin.poker.site
chown -R www-data:www-data /var/www/poker.site
chown -R www-data:www-data /var/www/admin.poker.site
chmod 775 /var/www/poker.site
chmod 775 /var/www/admin.poker.site

#cp /tmp/install_files/poker.service /etc/systemd/system/
#systemctl enable poker.service