FROM node:22-alpine

COPY dist /opt/action-files/dist

COPY package* /opt/action-files/dist/

RUN cd /opt/action-files/dist && \
    npm i -only=prod

COPY entrypoint.sh /opt/action-files/entrypoint.sh

WORKDIR /opt/action-files/dist

ENTRYPOINT [ "/opt/action-files/entrypoint.sh" ]