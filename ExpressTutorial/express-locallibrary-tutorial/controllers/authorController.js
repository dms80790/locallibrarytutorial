let Author = require('../models/author');
let async = require('async');
let Book = require('../models/book');
const { body,validationResult } = require('express-validator');


//display a list of all AuthorSchema
exports.author_list = function(req, res, next){
  Author.find()
  .sort([['family_name', 'ascending']])
  .exec(function(err, list_authors){
    if(err){return next(err);}
    //successful, so render
    res.render('author_list', {title: 'Author List', author_list: list_authors});
  });
};

//display detail page for a specific author
exports.author_detail = function(req, res, next){
  async.parallel({
      author: function(callback){
        Author.findById(req.params.id)
        .exec(callback);
      },
      authors_books: function(callback){
        Book.find({'author': req.params.id}, 'title summary')
        .exec(callback);
      },
    },
    function(err, results){
      if(err){
        return next(err);
      }
      if(results == null){
        let err = new Error('Author not found')
        err.status = 404;
        return next(err);
      }
      else{
        res.render('author_detail', {title: 'Author Detail', author: results.author, author_books: results.authors_books});
      }
    });
};

//display Author create form on GET
exports.author_create_get = function(req, res, next){
  res.render('author_form', {title: 'Create Author'});
};

//handle Author create on POST
exports.author_create_post = [
  //validate and sanitize fields
  body('first_name').trim().isLength({min:1}).escape().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  body('family_name').trim().isLength({min:1}).escape().withMessage('Family name must be specified.')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth').optional({checkFalsy:true}).isISO8601().toDate(),
  body('date_of_death', 'Invalid date of death').optional({checkFalsy:true}).isISO8601().toDate(),

  //process request after validation and sanitization.
  (req, res, next) => {
    //extract the validation errors from a request
    const errors = validationResult(req);

    if(!errors.isEmpty()){
      res.render('author_form', {title: 'Create Author', author:req.body, errors:errors.array()});
      return;
    }
    else{
      //data from form is valid
      let author = new Author(
        {
          first_name: req.body.first_name,
          family_name: req.body.family_name,
          date_of_birth: req.body.date_of_birth,
          date_of_death: req.body.date_of_death
        }
      );

      author.save(function(err){
        if(err){ return next(err); }

        //successful - redirect to new author detail
        res.redirect(author.url);
      });
    }
  }
];

//display Author delete form on GET
exports.author_delete_get = function(req, res, next){
  async.parallel({
    author: function(callback){
      Author.findById(req.params.id).exec(callback)
    },
    authors_books: function(callback){
      Book.find({'author': req.params.id}).exec(callback)
    },
  }, function(err, results){
    if(err){ return next(err); }
    if(results.author == null){
      //nothing to delete, so render list of all authors
      res.redirect('/catalog/authors');
    }
    //successful, so render
    res.render('author_delete', {title: 'Delete Author', author: results.author, author_books: results.authors_books});
  });
};

//handle Author delete on POST
exports.author_delete_post = function(req, res, next){
  async.parallel({
    author: function(callback){
      Author.findById(req.body.authorid).exec(callback)
    },
    authors_books: function(callback){
      Book.find({'author': req.body.authorid}).exec(callback)
    },
  }, function(err, results){
    if(err){ return next(err); }
    //success
    if(results.authors_books.length > 0){
      //author has books, render like GET route
      res.render('author_delete', {title:'Delete Author', author: results.author, author_books: results.authors_books});
      return;
    }
    else{
      //author has no books. Delete and redirect
      Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err){
        if(err){ return next(err); }
        //success -- go to author list

        res.redirect('/catalog/authors')
      })
    }
  });
};

//display author update form on GET
exports.author_update_get = function(req, res){
  Author.findById(req.params.id)
  .exec(function(err, author){
      if(err){ return next(err); }
      if(author == null){
        let err = new Error('Author not found');
        err.status = 404;
        return next(err);
      }
      res.render('author_form', {title: 'Update Author', author: author});
  });
};

//handle Author update on POST
exports.author_update_post = [
  //validate and sanitize fields
  body('first_name').trim().isLength({min:1}).escape().withMessage('First name must be specified.')
    .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  body('family_name').trim().isLength({min:1}).escape().withMessage('Family name must be specified.')
    .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth').optional({checkFalsy:true}).isISO8601().toDate(),
  body('date_of_death', 'Invalid date of death').optional({checkFalsy:true}).isISO8601().toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if(!errors.isEmpty()){
      res.render('author_form', {title: 'Update Author', author:req.body, errors:errors.array()});
      return;
    }
    else{
      //data from form is valid
      let author = new Author(
      {
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id:req.params.id //This is required, or a new ID will be assigned!
      });

      // Data from form is valid. Update the record.
      Author.findByIdAndUpdate(req.params.id, author, {}, function (err,author_updated) {
        if (err) { return next(err); }

        // Successful - redirect to book detail page.
        res.redirect(author_updated.url);
      });
    }
  }
];
