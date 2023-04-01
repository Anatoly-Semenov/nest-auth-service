FROM node:16-alpine

RUN apk add --no-cache python3 g++ make

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY . ./

RUN apk --no-cache --virtual build-dependencies add \
        make \
        g++

RUN yarn install
RUN apk del build-dependencies

EXPOSE 3002

CMD [ "yarn", "start" ]
