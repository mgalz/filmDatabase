const express = require('express');
const request = require('request');
const { MongoClient } = require('mongodb');
const { config } = require('./config.js');

const url = config.MONGO_URL;
const omdb_KEY = config.OMDB_API_KEY;
const ny_times_KEY = config.NY_TIMES_API_KEY;
const tmdb_KEY = config.TMDB_API_KEY;
const imdb_KEY = config.IMDB_API_KEY;

const app = express();

app.set('view engine', 'ejs'); //for .ejs files
app.use(express.static('public')); //for style.css 

app.get('/', function(req, res){
    res.render('Search');
});

app.get('/Results', function(req, res){
    var i = req.query.search;

    var params = 'https://www.omdbapi.com/?s=' + i + '&type=movie' + omdb_KEY;

   request(params, async function(err, resp, body){
        if(!err && resp.statusCode == 200){
          
            var omdbData = JSON.parse(body)

            var client = await MongoClient.connect(url, {useNewUrlParser: true});
            var dbo = client.db("Cluster0");
            var myobj = omdbData;
            await dbo.collection("posters").insertOne(myobj);

            var results = await dbo.collection("posters").find({}).sort({_id:-1}).limit(1).toArray();

            var omdb_mongoData = results[0];
            console.log(omdb_mongoData);
            
            var response = await omdb_mongoData['Response'];

            if (response == 'False') {
              res.render('Error');
            }
            else {
            res.render('Results', {data: omdb_mongoData});
            }
        } 
    });
});

//Box Office - Chilinski - 'github test'
app.get('/BoxOffice', function(req, res){

    var params = 'https://imdb-api.com/en/API/BoxOffice/' + imdb_KEY;

    request(params, async function(err, resp, body){
        if(!err && resp.statusCode == 200){

    var imdbdata = JSON.parse(body);
        console.log(imdbdata);

    var client = await MongoClient.connect(url, {useNewUrlParser: true});

    var dbo = client.db("Cluster0");

    var myobj = imdbdata;
        await dbo.collection('boxOffice').deleteOne(myobj);
        await dbo.collection("boxOffice").insertOne(myobj);

    var results = await dbo.collection("boxOffice").find({}).sort({_id:-1}).limit(1).toArray();

    var imdb_mongoData = results[0];
        console.log(imdb_mongoData);
        res.render('BoxOffice', {data: imdb_mongoData});
            }
        });
    });

app.listen(1000, function(){
    console.log('Web App is now running on Port: 1000');
});