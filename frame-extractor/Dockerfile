FROM gcr.io/google-appengine/nodejs

RUN apt-get -y update && apt-get install -y ffmpeg

# # Add the application source code.
ADD . /

RUN npm install

# Set common env vars
#ENV NODE_ENV production
#ENV PORT 8080

WORKDIR /

# start
CMD ["npm", "start"]