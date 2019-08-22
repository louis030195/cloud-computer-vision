FROM gcr.io/google-appengine/nodejs

RUN apt-get -y update

# Copy application code.
COPY . /app/

# Install dependencies.
RUN npm --unsafe-perm install

WORKDIR /app

# start
CMD ["npm", "start"]