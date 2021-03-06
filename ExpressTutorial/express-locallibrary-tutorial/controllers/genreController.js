var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body,validationResult } = require("express-validator");

//display a list of all Genres
exports.genre_list = function(req, res, next){
  Genre.find({}, 'name')
  .sort([['name', 'ascending']])
  .exec(function(err, list_genres){
    if(err){return next(err);}
    //successful, so render
    res.render('genre_list', {title:'Genre List', genre_list: list_genres});
  });
}

//display detail page for a specific Genre
exports.genre_detail = function(req, res, next){
  //we execute the two functions in parallel, followed by attempting to render
  async.parallel({
    genre: function(callback){
      Genre.findById(req.params.id)
      .exec(callback);
    },

    genre_books: function(callback){
      Book.find({'genre': req.params.id})
      .exec(callback);
    },
  }, function(err, results){
    if(err){
      return next(err);
    }
    if (results.genre == null){
      var err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }

    //successful, so render
    res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
  });
};

//display Genre create form on GET
exports.genre_create_get = function(req, res, next){
  res.render('genre_form', {title:'Create Genre'});
};

//handle Genre create on POST
exports.genre_create_post = [
  body('name', 'Genre name required').trim().isLength({min:1}).escape(),
  (req, res, next) => {
      const errors = validationResult(req);

      let genre = new Genre({name:req.body.name});

      if(!errors.isEmpty()){
        res.render('genre_form', {title:'Create Genre', genre:genre, errors:errors.array()});
        return;
      }
      else{
        //data from the form is valid
        Genre.findOne({'name': req.body.name})
          .exec(function(err, found_genre){
            if(err){ return next(err);}

            if(found_genre){
              //Genre exists, redirect to its detail page
              res.redirect(found_genre.url);
            }
            else {
              genre.save(function(err){
                if(err){ return next(err); }
                //Genre saved. Redirect to detail page
                res.redirect(genre.url);
              });
            }
          });

        }
      }
];

//display Genre delete form on GET
exports.genre_delete_get = function(req, res, next){
    async.parallel({
      genre: function(callback){
        Genre.findById(req.params.id).exec(callback)
      },
      genres_books: function(callback){
        Book.find({'genre': req.params.id}).exec(callback)
      },
    }, function(err, results){
      if(err){ return next(err); }
      if(results.genre == null){
        res.redirect('/catalog/genres');
      }
      //successful, so render
      res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books});
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
          Genre.findById(req.body.genreid).exec(callback)
        },
        genres_books: function(callback) {
          Book.find({ 'genre': req.body.genreid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.genres_books.length > 0) {
            // Genre has books. Render in same way as for GET route.
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books } );
            return;
        }
        else {
            // Genre has no books. Delete object and redirect to the list of genres.
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err); }
                // Success - go to genre list
                res.redirect('/catalog/genres')
            })
        }
    });
};

//display Genre update form on GET
exports.genre_update_get = function(req, res){
  res.send('STUB');
};

//handle Genre update on POST
exports.genre_update_post = function(req, res){
  res.send('STUB');
};
