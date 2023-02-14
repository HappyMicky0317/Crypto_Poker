#docker network create poker-network
#docker run --net <network name> --name test busybox nc -l 0.0.0.0:7000
#docker run --net <network name> busybox ping test

#run interactive
#docker run -it poker-payment-server -e POKER_MONGODB='d188cf9b6e49' sh  

#package
#docker build . -t poker-payment-server

#get the IP address of mongodb
#docker container inspect <container_id>

#restore database (if required)
#mongorestore -d PokerPaymentServer .

#run
#docker run --net poker-network --name paymentserver -p 8113:8113 -e POKER_MONGODB=mongodb -d poker-payment-server

#copy .env file from local to docker container
#docker cp .env paymentserver:/usr/src/poker.payments/.env

#view logs
#docker logs -f paymentserver


FROM node:12

# Create app directory
WORKDIR /usr/src/poker.payments

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm i
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY ./build .

EXPOSE 8113

CMD [ "node", "./poker.payments/src/PaymentProcessorBootstrapper.js" ]



#references
#https://stackoverflow.com/questions/32750748/how-to-edit-files-in-stopped-not-starting-docker-container
#https://stackoverflow.com/questions/31149501/how-to-reach-docker-containers-by-name-instead-of-ip-address