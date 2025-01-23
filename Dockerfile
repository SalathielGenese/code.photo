# syntax=docker/dockerfile:1
# check=experimental=all
ARG BASE_IMAGE
ARG DIST_TAR_BALL

FROM ${BASE_IMAGE:-node:22-alpine3.21}
WORKDIR /opt/app
ARG DIST_TAR_BALL
ENV HOST="0.0.0.0"
ENV SERVER_KEY_PATH=""
ENV SERVER_CERTIFICATE_PATH=""
LABEL authors="@SalathielGenese"
ADD ${DIST_TAR_BALL:-code.photo.tar.gz} .
ENTRYPOINT ["node", "dist/code.photo/server/server.mjs"]
