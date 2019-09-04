FROM node:10-slim

# Application parameters and variables
# ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV application_directory=/se-scraper
ENV puppeteer_cluster_directory=/se-scraper/src/puppeteer-cluster

# Create app directory
WORKDIR $application_directory

RUN apt-get update && \
apt-get install -y \
gconf-service \
libasound2 \
libatk1.0-0 \
libc6 \
libcairo2 \
libcups2 \
libdbus-1-3 \
libexpat1 \
libfontconfig1 \
libgcc1 \
libgconf-2-4 \
libgdk-pixbuf2.0-0 \
libglib2.0-0 \
libgtk-3-0 \
libnspr4 \
libpango-1.0-0 \
libpangocairo-1.0-0 \
libstdc++6 \
libx11-6 \
libx11-xcb1 \
libxcb1 \
libxcomposite1 \
libxcursor1 \
libxdamage1 \
libxext6 \
libxfixes3 \
libxi6 \
libxrandr2 \
libxrender1 \
libxss1 \
libxtst6 \
ca-certificates \
fonts-liberation \
libappindicator1 \
libnss3 \
lsb-release \
xdg-utils \
wget

# Bundle app source
COPY . .
WORKDIR $puppeteer_cluster_directory
RUN npm install \
    && npm run build

WORKDIR $application_directory
# skip installing scripts for puppeteer dependencies
# we've already installed puppeteer above.
RUN npm install --ignore-scripts

# Cleanup
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

EXPOSE $PORT

CMD ["dumb-init", "node", "server/server.js"]