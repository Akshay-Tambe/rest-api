var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var cardImageGenerator = require('./routes/cardImageGenerator');
var mergeImageGenerator = require('./routes/mergeImageGenerator');
var customerSMS = require('./routes/customerSMS');
var clickAndWrap = require('./routes/clickAndWrap');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const mongoose = require('mongoose');
var cors = require('cors');
var bodyParser = require('body-parser');
const zohoController = require('./controllers/zohoController')
const consumerSMSController = require('./controllers/customerSMSController');



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
  limit: "200mb",
  extended: true,
  parameterLimit: 50000
}));
app.use(bodyParser.json({limit: '200mb'}));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/card-image-genrator',cardImageGenerator);
app.use('/generate-merge-image', mergeImageGenerator);
app.use('/storeSMSCore', customerSMS);
app.use('/clickAndWrap', clickAndWrap);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/updateDronaStatement', zohoController.updateDronaStatement);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});



mongoose.connect(process.env.DB_Connect,{
  useUnifiedTopology : true, useNewUrlParser :true }, (err) => {
  if(!err)
      console.log("MongoDB connection Succeeded.");
  else
      console.log("Error in DB Connection : " + JSON.stringify(err, undefined,2));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var port = normalizePort(process.env.PORT);
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var host = server.address().address;
  var bind = typeof addr === 'string'
    ? 'pipe ' + host + addr
    : 'port ' + host + addr.port;
  console.log(bind);
}
module.exports = app;