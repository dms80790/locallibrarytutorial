let BookInstance = require('../models/bookinstance');
let Book = require('../models/book');
const { body,validationResult } = require('express-validator');
let async = require('async');

//display list of all BookInstances
exports.book_instance_list = function(req, res, next){
  BookInstance.find()
    .populate('book')
    .exec(function(err, list_bookinstances){
      if(err){return next(err);}
      //successful, so render
      res.render('book_instance_list', {title: 'Book Instance List', book_instance_list: list_bookinstances});
    });
};

//display detail page for a specific book BookInstance
exports.book_instance_detail = function(req, res, next){
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance){
      if(err){return next(err);}
      if(bookinstance==null){
        let err = new Error('Book copy not found!');
        err.status = 404;
        return next(err);
      }

      res.render('book_instance_detail', {title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance});
    })
};

//display BookInstance create form on GET
exports.book_instance_create_get = function(req, res, next){
  Book.find({},'title')
  .exec(function(err, books){
    if(err) { return next(err); }
    //successful, so render
    res.render('book_instance_form', {title: 'Create BookInstance', book_list: books});
  });
};

//handle BookInstance create on POST
exports.book_instance_create_post = [
  //validate and sanitize fields
  body('book', 'Book must be specified').trim().isLength({min:1}).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({min:1}).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({checkFalsy:true}).isISO8601().toDate(),

  //process request after validation and sanitization
  (req, res, next) => {
    //extract validation errors from request
    const errors = validationResult(req);

    //create a BookInstance object with escaped and trimmed data
    let bookinstance = new BookInstance(
      {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
      });

    if(!errors.isEmpty()){
      //there are errors. render form again
      Book.find({}, 'title')
          .exec(function(err, books){
              if(err) {return next(err);}
              //successful, so render
              res.render('book_instance_form', {title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
      });
      return;
    }
    else{
      //data from form is valid
      bookinstance.save(function(err){
        if(err){ return next(err); }
        //successful, redirect to new record
        res.redirect(bookinstance.url);
      });
    }
  }
];

//display Book Instance delete form on GET
exports.book_instance_delete_get = function(req, res, next){
    BookInstance.findById(req.params.id).exec(function(err, copy){
      if(err){ return next(err); }
      if(copy == null){
        //nothing to delete, so render list of all book instances
        res.redirect('/catalog/book_instances');
      }
      //successful, so render
      res.render('book_instance_delete', {title: 'Delete Book Instance', bookinstance: copy});
    });
};

//handle Book Instance delete on POST
exports.book_instance_delete_post = function(req, res, next){
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBook(err){
      if(err){ return next(err); }
      //success -- go to book list
        console.log('book instance deleted');
        res.redirect('/catalog/books')
    });
};


//display BookInstance update form on GET
exports.book_instance_update_get = function(req, res){
  //get bookinstance, authors, genres
  async.parallel({
      book_instance: function(callback){
        BookInstance.findById(req.params.id).populate('book').exec(callback);
      },
      books: function(callback){
        Book.find({}).exec(callback);
      },
    }, function(err, results){
      if(err){ return next(err); }
      if(results.book_instance == null){
        let err = new Error('Book instance not found');
        err.status = 404;
        return next(err);
      }
      //success
      res.render('book_instance_form', {title: 'Update Book', bookinstance: results.book_instance, book_list: results.books});
  });
};

//handle bookInstance update on POST
exports.book_instance_update_post =  [
  //validate and sanitize fields
  body('book', 'Book must be specified').trim().isLength({min:1}).escape(),
  body('imprint', 'Imprint must be specified').trim().isLength({min:1}).escape(),
  body('status').escape(),
  body('due_back', 'Invalid date').optional({checkFalsy:true}).isISO8601().toDate(),

  //process request after validation and sanitization
  (req, res, next) => {
    //extract validation errors from request
    const errors = validationResult(req);

    //create a BookInstance object with escaped and trimmed data
    let bookinstancetemp = new BookInstance(
    {
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id:req.params.id, //This is required, or a new ID will be assigned!
    });

    if(!errors.isEmpty()){
      //there are errors. render form again
      Book.find({}, 'title')
      .exec(function(err, books){
        if(err) {return next(err);}

        //successful, so render
        res.render('book_instance_form', {title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance});
      });

      return;
    }
    else {
      // Data from form is valid. Update the record.
      BookInstance.findByIdAndUpdate(req.params.id, bookinstancetemp, {}, function (err,thecopy) {
        if (err) { return next(err); }
        // Successful - redirect to book detail page.
        res.redirect(thecopy.url);
      });
    }
  }
];
