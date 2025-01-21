# syntax=docker/dockerfile:1
# check=error=true;experimental=all
ARG BASE_IMAGE
ARG DIST_TAR_BALL

FROM ${BASE_IMAGE:-node:22-alpine3.21}
WORKDIR /opt/app
ARG DIST_TAR_BALL
LABEL authors="@SalathielGenese"
ADD ${DIST_TAR_BALL:-code.photo.tar.gz} .
ENTRYPOINT ["node", "dist/code.photo/server/server.mjs"]
