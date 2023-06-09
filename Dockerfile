FROM node:alpine

WORKDIR /app

RUN apk add --update --no-cache py3-pip python3-dev gcc libc-dev linux-headers g++ make bash
RUN pip3 install garmindb

COPY package.json yarn.lock tsconfig.json ./
RUN yarn install --production

COPY config/config.py /usr/lib/python3.10/site-packages/garmindb
RUN rm /usr/bin/garmindb_cli.py
COPY config/garmindb_cli.py /usr/bin
RUN chmod +x /usr/bin/garmindb_cli.py
RUN mkdir /root/.GarminDb
COPY config/GarminConnectConfig.json /root/.GarminDb

COPY src ./src

CMD yarn start