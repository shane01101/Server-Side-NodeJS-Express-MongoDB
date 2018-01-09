const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.find({})
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log("Entered Post");
    Favorites.findOne({'user': req.user._id})
    .then((favorites) => {
        if(favorites) { //fav exist
            for(i = 0; i < req.body.length; i++) {
                if(favorites.dishes.indexOf(req.body[i]._id) === -1) { //not in array
                    favorites.dishes.push(req.body[i]._id);
                }
                else {
                    console.log("Could not add dish: " + req.body[i]._id);
                }
            }
            favorites.save()
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            })
            .catch(err => next(err));
        }
        else { //no fav doc exists so create
            Favorites.create({user: req.user._id, dishes: []})
            .then((favorites) => {
                for(i = 0; i < req.body.length; i++) {
                    if(favorites.dishes.indexOf(req.body[i]._id) === -1) { //not in array
                        favorites.dishes.push(req.body[i]._id);
                    }
                    else {
                        console.log("Could not add dish: " + req.body[i]._id);
                    }
                }
                favorites.save()
                .then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                })
                .catch(err => next(err));
            }, (err) => next(err))
            .catch((err) => next(err));
        } 
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({'user': req.user._id})
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Favorites.findById(req.params.dishId)
    .populate('User')
    .populate('Dish')
    .then((favorite) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({'user': req.user._id})
    .then((favorites) => {
        if(favorites) { //fav exist
            if(favorites.dishes.indexOf(req.params.dishId) === -1) { //not in array
                favorites.dishes.push(req.params.dishId);
                favorites.save()
                .then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                })
                .catch(err => next(err));
            }
            else {
                err = new Error('Error: Favorite dish already exists');
                err.status = 404;
                return next(err);
            }
        }
        else{ //no fav doc exists so create
            Favorites.create({user: req.user._id, dishes: [req.params.dishId]})
            .then((favorites) => {
                console.log('Favorite Created ', favorites);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
        } 
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({'user': req.user._id})
    .then((favorites) => {
        if(favorites) {
            if(favorites.dishes.indexOf(req.params.dishId) > -1) {
                favorites.dishes.splice(favorites.dishes.indexOf(req.params.dishId), 1);
                favorites.save()
                .then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);                
                }, (err) => next(err));
            }
        }
        else {
            var err = new Error('Dish does not exist!');
            err.status = 403;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

module.exports = favoriteRouter;