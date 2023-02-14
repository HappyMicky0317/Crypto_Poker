#!/bin/bash

#to run manually
#./install.sh 2>&1 | tee output.log


USER=troy

#add user
useradd -s /bin/bash -m -p $(openssl passwd -1 fred) $USER 
usermod -aG sudo $USER

#delete default user
sudo deluser --remove-home ubuntu

#enable PasswordAuthentication
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config; 
systemctl restart sshd;

apt-get update

#configure firewall
apt-get install ufw -y
ufw allow 22,4200,8113/tcp
ufw --force enable

ufw status verbose
apt-get install ntp curl git build-essential -y

#nodejs
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
apt-get install nodejs -y

#install http-server
npm i http-server -g

#mongodb
wget --no-verbose https://repo.mongodb.org/apt/ubuntu/dists/bionic/mongodb-org/4.2/multiverse/binary-amd64/mongodb-org-server_4.2.0_amd64.deb
dpkg -i mongodb-org-server_4.2.0_amd64.deb
apt-get -f install
wget --no-verbose https://repo.mongodb.org/apt/ubuntu/dists/bionic/mongodb-org/4.2/multiverse/binary-amd64/mongodb-org-tools_4.2.0_amd64.deb
dpkg -i mongodb-org-tools_4.2.0_amd64.deb
wget --no-verbose https://repo.mongodb.org/apt/ubuntu/dists/bionic/mongodb-org/4.2/multiverse/binary-amd64/mongodb-org-shell_4.2.0_amd64.deb
dpkg -i mongodb-org-shell_4.2.0_amd64.deb

sudo service mongod start
sudo systemctl enable mongod.service

#install dashcore
cd /home/$USER
sudo -u $USER wget --no-verbose https://github.com/dashpay/dash/releases/download/v0.15.0.0/dashcore-0.15.0.0-x86_64-linux-gnu.tar.gz
sudo -u $USER tar -xzf dashcore-0.15.0.0-x86_64-linux-gnu.tar.gz
rm -rf *.gz

#setup dashcore
sudo -u $USER mkdir .dashcore
sudo -u $USER cp /tmp/install_files/dash.conf /home/$USER/.dashcore/
mkdir /opt/dashcore
cp /tmp/install_files/transaction.sh /opt/dashcore
chmod +x /opt/dashcore/transaction.sh
cp /vagrant/install_files/dashd.service /etc/systemd/system/
systemctl enable dashd.service
systemctl start dashd.service

#nordvpn
apt-get install unzip openvpn -y
cd /etc/openvpn
wget https://downloads.nordcdn.com/configs/archives/servers/ovpn.zip
unzip ovpn.zip
rm ovpn.zip

mkdir -p /home/$USER/poker/poker.payments
sudo -u $USER cp /tmp/install_files/check_vpn.sh /home/$USER
sudo -u $USER cp /tmp/install_files/payments.env /home/$USER/poker/poker.payments/.env
chmod 600  /home/$USER/poker/poker.payments/.env
sudo -u $USER cp /tmp/install_files/unpack_payment_server.sh /home/$USER
chmod +x /home/$USER/unpack_payment_server.sh
chmod +x /home/$USER/check_vpn.sh