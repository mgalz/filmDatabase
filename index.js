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

app.set('view engine', 'ejs'); // sets view engine for .ejs files

app.get('/', function(req, res){
    res.render('Search');
});

// General Film Info Search Page: Mike G.
app.get('/Results', function(req, res){
    var i = req.query.search;

    var params = 'https://www.omdbapi.com/?s=' + i + '&type=movie' + omdb_KEY;
    
        request(params, async function(err, resp, body){
            if(!err && resp.statusCode == 200){
          
                var omdbData = JSON.parse(body)

                var client = await MongoClient.connect(url, {useNewUrlParser: true});
                var dbo = client.db("Cluster0");
                var myobj = omdbData;
            
                await dbo.collection('movieInfo').remove();
                await dbo.collection("movieInfo").insertOne(myobj);

                var results = await dbo.collection("movieInfo").find({}).sort({_id:-1}).limit(1).toArray();

                var omdb_mongoData = results[0];
            
                var response = await omdb_mongoData['Response'];
                console.log(response);

                    if (response == 'False') {
                        error = await omdb_mongoData['Error'];

                        if (error == "Too many results.") {
                        res.render('err_views/Many_Results_err');
                    }
                        else {
                        res.render('err_views/No_Results_err')
                    }
                }   
                    else {
                    res.render('Results', {data: omdb_mongoData});
            }   
        } 
    });
});

//Box Office Page: Mike C.
app.get('/BoxOffice', function(req, res){

    var params = 'https://imdb-api.com/en/API/BoxOffice/' + imdb_KEY;

    request(params, async function(err, resp, body){
        if(!err && resp.statusCode == 200){

    var imdbdata = JSON.parse(body);

    var client = await MongoClient.connect(url, {useNewUrlParser: true});

    var dbo = client.db("Cluster0");

    var myobj = imdbdata;

        await dbo.collection('boxOffice').remove();
        await dbo.collection("boxOffice").insertOne(myobj);

    var results = await dbo.collection("boxOffice").find({}).sort({_id:-1}).limit(1).toArray();

    var imdb_mongoData = results[0];

        res.render('BoxOffice', {data: imdb_mongoData});

        } 
    });
});

// Cast Page: Cyril
app.get('/Cast', function(req, res){
    var i = req.query.cast_search;

    if (i == "") {
        res.render('err_views/No_Cast_err');
    }
    // err check: checks for empty string

    if (!i.replace(/\s/g, '').length) {
        res.render('err_views/No_Cast_err');
    }
    // err check: checks for string that only contains whitespace

    var s = 'http://api.themoviedb.org/3/search/movie?api_key='+ tmdb_KEY +'&query=' + i;

    request(s, async function(err, resp, body){
     if(!err && resp.statusCode == 200){

	var info = JSON.parse(body);
    check_res = info.results[0];

    if (check_res == undefined) {
        res.render('err_views/No_Cast_err');
    }
    else {
    var movieId = info.results[0].id;
    var title = info.results[0].original_title;
    console.log(movieId);
    console.log(title);
    }
    
    var params = 'https://api.themoviedb.org/3/movie/' + movieId + '/credits?' + 'api_key=' + tmdb_KEY + '&language=en-US';

    await request(params, async function(err, resp, body){
        if(!err && resp.statusCode == 200){

            var tmdbData = JSON.parse(body)
            var client = await MongoClient.connect(url, {useNewUrlParser: true});
            var dbo = client.db("Cluster0");
            var myobj = tmdbData;
            await dbo.collection('cast').remove();
            await dbo.collection("cast").insertOne(myobj);

            var results = await dbo.collection("cast").find({}).sort({_id:-1}).limit(1).toArray();

            var tmdb_mongoData = results[0];

            await res.render('Cast', {data: {info: tmdb_mongoData, title}});

        }
            });   
        } 
    });
});

// Review Page: Jorge
app.get('/Reviews', function(req, res){
    var i = req.query.review_search;

    var params = 'https://api.nytimes.com/svc/movies/v2/reviews/search.json?query='+ i +'&api-key='+ ny_times_KEY;

   request(params, async function(err, resp, body){
        if(!err && resp.statusCode == 200){
          
            var NYtimesdata = JSON.parse(body)

            var client = await MongoClient.connect(url, {useNewUrlParser: true});
            var dbo = client.db("Cluster0");
            var myobj = NYtimesdata;
            await dbo.collection('reviews').remove();
            await dbo.collection("reviews").insertOne(myobj);

            var results = await dbo.collection("reviews").find({}).sort({_id:-1}).limit(1).toArray();

            var nytimes_mongoData = results[0];

            var results = await nytimes_mongoData['results'];
           
            if (results == null) {
                res.render('err_views/No_Reviews_err');
            }
            else {
            res.render('Reviews', {data: nytimes_mongoData});
            }
        } 
    });
});


app.listen(1000, function(){
    console.log('Web App is now running on Port: 1000');
});
