Project is still in production.

Current required dependencies include:
ejs
express
mongodb
request

Other requirements:
API keys
a MongoDB Cluster (for index.js and app-2.js)

To run current project:
- 'npm install' all dependencies

--- For index.js
- create a 'config.js' (or alter config_temp.js) file and add your own API keys to be exported to index.js
- add your MongoDB Cluster URL to "config.js" (for export to index.js as well)
- run 'node index.js' in terminal

--- For app.js
- Set up your config file the same as for index.js - app.js requires API keys but does not require a MongoDB Cluster
*It is the same web app, app.js simply bypasses the need for MongoDB cluster and pulls all info direct from the APIs.
- run 'node app.js'

--- For app-2.js
- Also, set up your config file the same as for index.js (including MongoDB information)
*This file requires a MongoDB for ONLY the Box Office info. This is because Box Office has a limit in calls per day.
*Using MongoDB helps avoid reaching this call limit, while the rest of the APIs can be called upon as often as needed without a need for a MongoDB cluster.
- run 'node app-2.js'

See the running Demo at: https://fullstackmovies.xyz/
