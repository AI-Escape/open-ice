# pull official base image
FROM ubuntu:22.04

# set working directory
WORKDIR /usr/src/app

ARG DEBIAN_FRONTEND=noninteractive

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install system dependencies
RUN apt-get update \
  && apt-get -y install netcat gcc postgresql wget xvfb unzip jq curl \
  && apt-get clean

# Install Google Chrome dependencies
RUN apt-get install -y libxss1 libappindicator1 libgconf-2-4 \
  fonts-liberation libasound2 libnspr4 libnss3 libx11-xcb1 libxtst6 lsb-release xdg-utils \
  libgbm1 libnss3 libatk-bridge2.0-0 libgtk-3-0 libx11-xcb1 libxcb-dri3-0


# Update package lists and install dependencies
RUN apt-get install software-properties-common -y

# Add the deadsnakes PPA for newer Python versions
RUN add-apt-repository ppa:deadsnakes/ppa -y

# Update package lists again and install Python 3.13 along with necessary packages
RUN apt-get update && apt-get install -y \
  python3.13 \
  python3.13-dev \
  python3.13-venv


# Install pip for Python 3.13 using the official get-pip.py script
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3.13

# install python dependencies
RUN python3.13 -m pip install --upgrade pip
COPY ./requirements.txt .
RUN python3.13 -m pip install -r requirements.txt

# add app
COPY . .