// opens file system
var fs = require('fs');

// creates WebServer
var http = require('http');
var connect = require('connect');
var app = connect();
var socketio = require('socket.io');

// open mongoose
var mongoose = require('mongoose');

// connects to MongoDB / the name of DB is set to 'kokoatalk'
mongoose.connect('mongodb://localhost/kokoatalk');

// get the connection from mongoose
var db = mongoose.connection;

// gets notified if error occurs
db.on('error', console.error.bind(console, 'connection error:'));

// executed when the connection opens
db.once('open', function callback () {
	// if connection open succeeds print out the following in the console
  	console.log("open: success");
});

// creates DB schema for MongoDB / requires 'username' & 'message'
var userSchema = mongoose.Schema({
    username: 'string',
    message: 'string'
});

// compiles our schema into a model
var Chat = mongoose.model('Chat', userSchema);

// request from web browser
app.use('/', function(req,res,next){
	if(req.url != '/favicon.ico'){
		fs.readFile(__dirname+'/kokoatalk.html', function(error, data){
			res.writeHead(200, {'Content-Type':'text/html'});
			res.write(data);
			res.end();
		});
	}
});

// creates server
var server = http.createServer(app);
server.listen(8008, function(){
	console.log('server listen on port 8008');
});

// creates WebSocket Server
var io = socketio.listen(server);

// executed on connection
io.sockets.on('connection', function(socket) {

	// receives message from DB
	Chat.find(function (err, result) {
		for(var i = 0 ; i < result.length ; i++) {
			var dbData = {name : result[i].username, message : result[i].message};
			io.sockets.sockets[socket.id].emit('preload', dbData);
		}
	});


	// sends message to other users + stores data(username + message) into DB
	socket.on('message', function(data) {

		io.sockets.emit('message', data);
		// add chat into the model
		var chat = new Chat({ username: data.name, message: data.message });

		chat.save(function (err, data) {
		  if (err) {// TODO handle the error
		  	console.log("error");
		  }
		  console.log('message is inserted');
		});

	});
});