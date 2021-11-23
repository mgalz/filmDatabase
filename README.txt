Project is still in production.

Current required dependencies include:
ejs
express
mongodb
request

Other requirements:
API keys
a MongoDB Cluster (for index.js)

To run current project:
- 'npm install' all dependencies,
- create a 'config.js' (or alter config_temp.js) file and add your own API keys to be exported to "index.js",
- add your MongoDB Cluster URL to "config.js" (to be exported to "index.js" as well, if using index.js),
- run 'node index.js' in terminal
or
- run 'node app.js' in terminal - app.js requires API keys but does not require a MongoDB Cluster
*It is the same web app, app.js simply bypasses the need for MongoDB cluster and pulls all info direct from the APIs.

See the running Demo at: https://fullstackmovies.xyz/
