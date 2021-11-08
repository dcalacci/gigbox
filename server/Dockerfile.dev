# pull official base image
FROM python:3.7.6-buster

ENV PYTHONPATH /usr/lib/python3/dist-packages
## install dependencies
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y netcat-openbsd gcc postgresql-client libgeos-dev python3-opencv python3-pandas libsm6 libxext6 tesseract-ocr && \
    apt-get clean


## set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /usr/src/app

## add user
RUN addgroup --system user && adduser --system --no-create-home --group user
RUN chown -R user:user /usr/src/app && chmod -R 755 /usr/src/app

# install dependencies
RUN pip install --upgrade pip
COPY ./requirements.txt /usr/src/app/requirements.txt
RUN pip install --no-cache -r requirements.txt

# copy project
# COPY . /usr/src/app/

