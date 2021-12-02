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
app.use(express.static('images')); // sets 'images' folder for image use in .ejs files

// Home 'Search' Page
app.get('/', async function(req, res){
    
    // Box Office Info, direct from API

    var timestamp = new Date();
    console.log(timestamp);

    var params = 'https://imdb-api.com/en/API/BoxOffice/' + imdb_KEY;

    await request(params, async function(err, resp, body){
        if(!err && resp.statusCode == 200){
              
            var imdbdata = JSON.parse(body);
            
            await res.render('Search', {data: imdbdata});
        }
    });
});

// General Film Info. Search Page, Mike G., using MongoDB
app.get('/Results', function(req, res){
    
    var i = req.query.search;
    var params = 'https://www.omdbapi.com/?s=' + i + '&type=movie' + omdb_KEY;
    
    request(params, async function(err, resp, body){
        if(!err && resp.statusCode == 200){
          
            var omdbData = JSON.parse(body)

            var client = await MongoClient.connect(url, {useNewUrlParser: true});
            var dbo = await client.db("Cluster0");
            var myobj = await omdbData;
                
            await dbo.collection('movieInfo').deleteMany({});
            await dbo.collection("movieInfo").insertOne(myobj);

            var results = await dbo.collection("movieInfo").find({}).sort({_id:-1}).limit(1).toArray();

            await client.close();

            var omdb_mongoData = await results[0];
            
            var response = await omdb_mongoData['Response'];

            //error handling, checks for queries yeilding either too many results or no results
            if (response == 'False'){

                error = await omdb_mongoData['Error'];

                if (error == "Too many results."){
                    res.render('err_views/Many_Results_err');
                }
                else{
                    res.render('err_views/No_Results_err') 
                }

            }   
            else{
                res.render('Results', {data: omdb_mongoData}); 
            }   
        } 
    });
});

// Box Office Page, Mike C., using MongoDB
app.get('/BoxOffice', function(req, res){

    var params = 'https://imdb-api.com/en/API/BoxOffice/' + imdb_KEY;

    request(params, async function(err, resp, body){
        if(!err && resp.statusCode == 200){

            var imdbdata = JSON.parse(body);

            var client = await MongoClient.connect(url, {useNewUrlParser: true});
            var dbo = await client.db("Cluster0");
            var myobj = await imdbdata;

            await dbo.collection('boxOffice').deleteMany({});
            await dbo.collection("boxOffice").insertOne(myobj);

            var results = await dbo.collection("boxOffice").find({}).sort({_id:-1}).limit(1).toArray();

            await client.close();

            var imdb_mongoData = await results[0];

            res.render('BoxOffice', {data: imdb_mongoData});
        } 
    });
});

// Cast Page, Cyril, using MongoDB
app.get('/Cast', function(req, res){
    
    var i = req.query.cast_search;

    //error handling, checks for an empty string
    //*a return statement is used to avoid 'Error [ERR_HTTP_HEADERS_SENT]'
    if (i == ""){
        res.render('err_views/No_Cast_err');
        return;
    }
    
    //error handling, checks for a string consisting only of whitespace
    //*
    if (!i.replace(/\s/g, '').length){
        res.render('err_views/No_Cast_err');
        return;
    }

    var s = 'http://api.themoviedb.org/3/search/movie?api_key='+ tmdb_KEY +'&query=' + i;

    //TMDb only allows 'Cast & Crew' Search by Movie ID
    //To Search for 'Cast & Crew' by Movie Title, we must first get the Movie ID, first TMDb query
    request(s, async function(err, resp, body){
        if(!err && resp.statusCode == 200){

	        var info = JSON.parse(body);
            var check_res = await info.results[0];

            //if statment purposes:
            //error handling, checks to see if our array of results is undefined
            //grabs Movie ID, Title, and Year of release when our array of results is not undefined
            //movieID to be used as a parameter for our second TMDb query
            //movieTitle and movieYear to be used to grab an accurate Film Poster from OMDb for our second TMDb query
            if (check_res == undefined){
                res.render('err_views/No_Cast_err');
            }
            else{
                var movieId = info.results[0].id;
                var movieTitle = info.results[0].original_title;
                var year = info.results[0].release_date;
                //var movieYear converts String 'year' from YYYY/MM/DD to YYYY
                var movieYear = year.substring(0, 4);
                console.log(movieId);
                console.log(movieTitle);
                console.log(movieYear);
            }

            // OMDb Poster results, direct from API
            var omdb_url = 'https://www.omdbapi.com/?s=' + movieTitle + '&type=movie' + omdb_KEY;

            await request(omdb_url, async function(err, resp, body) {
                       
                var info = JSON.parse(body);
                var results = await info.Search;
                var response = await info.Response;
                var poster;

                //error handling, checks to see if our OMDb Search Array is equal to 'False',
                //and if our Movie Title is undefined or NULL
                if (response == 'False' || movieTitle == undefined || movieTitle == null){
                    var Poster = 0;
                }

                //when a poster is available:
                //our for loop compares our OMDb data for Title and Year to our TMDB data for Title and Year
                //a match for both Film Title and Year of release results in a poster being grabbed
                if (Poster == 0){
                    poster = "No poster available!"
                }
                else{
                    for (let i = 0; i < results.length; i++){
                    
                        var currentTitle = results[i].Title.toLowerCase();
                        var currentYear = results[i].Year;
                        var Title = movieTitle.toLowerCase();
                        var Year = movieYear;

                        console.log(currentTitle);
                        console.log(Title);
                        console.log(currentYear);
                        console.log(Year);

                        if (currentTitle == Title && currentYear == Year){
                            var x = i;
                            poster = results[x].Poster;
                            break;
                        }
                        else{
                            poster = "No poster available!"
                        }
                    }
                }
                console.log(poster);

                // Second TMDb query
                var params = 'https://api.themoviedb.org/3/movie/' + movieId + '/credits?' + 'api_key=' + tmdb_KEY + '&language=en-US';

                await request(params, async function(err, resp, body){
                    if(!err && resp.statusCode == 200){

                        var tmdbData = JSON.parse(body);

                        var client = await MongoClient.connect(url, {useNewUrlParser: true});
                        var dbo = await client.db("Cluster0");
                        var myobj = await tmdbData;
            
                        await dbo.collection('cast').deleteMany({});
                        await dbo.collection("cast").insertOne(myobj);

                        var results = await dbo.collection("cast").find({}).sort({_id:-1}).limit(1).toArray();

                        await client.close();

                        var tmdb_mongoData = await results[0];

                        await res.render('Cast', {data: {info: tmdb_mongoData, movieTitle, poster}});

                    }
                });   
            });
        } 
    });
});

// Review Page, Jorge, using MongoDB
app.get('/Reviews', function(req, res){

    var i = req.query.review_search;

    var params = 'https://api.nytimes.com/svc/movies/v2/reviews/search.json?query='+ i +'&api-key='+ ny_times_KEY;

    request(params, async function(err, resp, body){
        if(!err && resp.statusCode == 200){
          
            var NYtimesdata = JSON.parse(body)

            var client = await MongoClient.connect(url, {useNewUrlParser: true});
            var dbo = await client.db("Cluster0");
            var myobj = await NYtimesdata;

            await dbo.collection('reviews').deleteMany({});
            await dbo.collection("reviews").insertOne(myobj);

            var results = await dbo.collection("reviews").find({}).sort({_id:-1}).limit(1).toArray();

            await client.close();

            var nytimes_mongoData = await results[0];

            var results = await nytimes_mongoData['results'];
           
            //error handling, checks to see if our results value is NULL
            if (results == null){
                res.render('err_views/No_Reviews_err');
            }
            else{
            res.render('Reviews', {data: nytimes_mongoData});
            }
        } 
    });
});

//starts localhost on port: 8080
app.listen(8080, function(){
    console.log('Web App is now running on Port: 8080');
});