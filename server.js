var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

var request = require('request');
var cheerio = require('cheerio');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static('public'));


mongoose.connect('mongodb://localhost/week18day3mongoose');
var db = mongoose.connection;

db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

db.once('open', function() {
  console.log('Mongoose connection successful.');
});


var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


app.get('/', function(req, res) {
  res.send(index.html);
});

app.get('/scrape', function(req, res) {
	request('https://www.reddit.com/r/science', function(error, response, html) {
		if (error) {
			throw error;
		}
		var $ = cheerio.load(html);

		var result = [];

		$('p.title').each(function(i, element) {
			var title = $(element).text();
			var link = $(element).find('a').first().attr('href');

			result.push({
				title: title,
				link: link
			});
		});
		var entry = new Article(result);

		entry.save(function(err, doc) {
			if (err) {
				console.log(err);
			}
			else {
				console.log(doc);
			}
		});
	});
  res.send("Scrape Complete");
});

app.get('/articles', function(req, res){
	Article.find({}, function(err, doc){
		if (err){
			console.log(err);
		}
		else {
			res.json(doc);
		}
	});
});

app.get('/articles/:id', function(req, res){
	Article.findOne({'_id': req.params.id})
	.populate('note')
	.exec(function(err, doc){
		if (err){
			console.log(err);
		} 
		else {
			res.json(doc);
		}
	});
});


app.post('/articles/:id', function(req, res){
	var newNote = new Note(req.body);

	newNote.save(function(err, doc){
		if(err){
			console.log(err);
		} 
		else {
			Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
			.exec(function(err, doc){
				if (err){
					console.log(err);
				} else {
					res.send(doc);
				}
			});
		}
	});
});



app.listen(3000, function() {
  console.log('App running on port 3000!');
});