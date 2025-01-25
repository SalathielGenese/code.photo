# syntax=docker/dockerfile:1
# check=experimental=all
ARG BASE_IMAGE
ARG DIST_TAR_BALL

FROM ${BASE_IMAGE:-node:22-alpine3.21}
WORKDIR /opt/app
LABEL authors="@SalathielGenese"
ENTRYPOINT ["node", "dist/code.photo/server/server.mjs"]

ARG DIST_TAR_BALL
ENV HOST="0.0.0.0"
ENV CERTIFICATE_PATH=""
ENV CERTIFICATE_KEY_PATH=""
ENV CERTIFICATE_AUTHORITY_PATH=""
ADD ${DIST_TAR_BALL:-code.photo.tar.gz} .
