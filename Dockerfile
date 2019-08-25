FROM gcr.io/google-appengine/nodejs

RUN apt-get -y update

ENV PORT 8080
ENV SECRET "keyboardcat"

# Copy application code.
COPY . /app/

# Install dependencies.
RUN npm --unsafe-perm install

WORKDIR /app

# start
CMD ["npm", "start"]