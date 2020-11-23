var express = require('express');
var app = express();
var port = process.env.port || 8080;
var  mongoose = require('mongoose');
var bodyPaser = require('body-parser');
var morgan = require('morgan');
const { urlencoded } = require('body-parser');
var Users = require('./models/User');
var jwt = require('jsonwebtoken');


var supperSecret = 'yanghoparttime';



app.use(bodyPaser.urlencoded({extended:true}));
app.use(bodyPaser.json());


app.use(morgan('dev'));

app.use (function(req,res,next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Method','GET,POST');
    res.setHeader('Access-Control-Allow-Header','X-Request-With,content-type,Authorization');
    next();

});

var dbUrl = 'mongodb+srv://youngboy:test123@mongodb.cnnjf.mongodb.net/MongoT?retryWrites=true&w=majority'
mongoose.connect(dbUrl,{useNewUrlParser:true,useUnifiedTopology:true})
.then(() => console.log('connected to db'))
.catch((err) => console.log(err));

app.get('/' , (req,res) => {
    res.send('hello');
});

var apiRouter = express.Router();


// route to athentication user
apiRouter.post('/authenticate', function(req,res)
{
    Users.findOne({username:req.body.username
    }).select('name username password').exec(function(err,user){
        if(err) throw err;

        if(!user) {
            res.json({
                success: false,
                message: 'Authenticate failed, User not found'
            });
        }
        else if(user)
        {
            var validPassword = user.comparePassword(req.body.password);
            if(!validPassword)
            {
                res.json({
                    success: false,
                    message: 'Authenticate failed, password wrong'
                })
            } else
            {
                var token = jwt.sign({
                    username: user.username
                },supperSecret, {expiresIn:'24h'});

                res.json({
                    success:true,
                    message: 'provied token',
                    token: token
                });

            }
        }
    });

});


// verify token
apiRouter.use(function(req,res,next)
{
    // do logging
    console.log('doing on app');

    // check header or url parameters or post parameter for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    
    if(token)
    {
        jwt.verify(token,supperSecret ,function(err,decoded){
            if(err)
            {
                return res.json({
                success:false, 
                message: 'Failed to authenticate token'
                });
            }
            else {
                // if everything good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    }else
    { // nothing
        // if there is no token, return an http response of 403
        return res.status(403).send({
            success: false,
            message:'no token provied'
        });
    }

});



apiRouter.get('/', (req,res) => {
    res.json({message: 'server work'})
});


apiRouter.route('/Users')
.post(function(req,res) {

    var user = new Users();
    user.name = req.body.name;
    user.username =req.body.username;
    user.password = req.body.password;

    user.save(function(err)
    {
        if(err)
        {
            if(err.code = 11000)
            return res.json({success: false, message:'User already exist'});
            else
            return res.send(err);
         }

    res.json({message:'User created'});

    });
   

})

.get(function(req,res)
{
    Users.find(function(err,users) {
        if(err)
        return res.send(err);

        res.json(users);
    });
});

//find user follow id
apiRouter.route('/Users/:user_id')
.get(function(req,res) {
    Users.findById(req.params.user_id, function(err,user){
        if(err) return res.send(err);

        res.json(user);
    });
})

//update user 
.put(function(req,res) {
 Users.findById(req.params.user_id, function(err,user){
     if(err) return res.send(err);
    
     // set new infomation if it exist in request
     if(req.body.name) user.name= req.body.name;
     if(req.body.username) user.username = req.body.username;
     if(req.body.password) user.password = req.body.password;

     user.save(function(err) {
         if(err) return res.send(err);

         res.json({message: 'user updated '});
     });

 });
})

// delete user
.delete(function(req,res) {
    Users.remove({_id:req.params.user_id}, function(err,user) {
        if(err) return res.send(err);

        res.json({message: 'successfully delete'})
    });
})


app.use('/api',apiRouter);


app.listen(port, () => {
    console.log('server running on port ' + port);
});