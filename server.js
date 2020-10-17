/*
This software handles the server side of the system.  It's purpose is
to receive incoming messages and ensure that the correct data is logged
for the appropriate event.

Logical Flow:
	Host server
	Open server websocket
	receive connection from client socket
	receive message from client
	log data
	receive password attempt from client
	authenticate password

Functions:
	getUserId()
	shuffle(array)
	generatePassword()
	writeCSV()
	logData(data)
	authenticate(user_input)

	getUserId():
		checks the data.csv file to ensure when a new user has begun
		that userID is appropriately incremented and not duplicated

	shuffle(array):
		Fisher-Yates shuffle to randomize any array that needs to be
		randomized

	generatePassword():
		Implements our password scheme generating, four random integers
		between 0-9, chooses one random .png file between 0-20,
		chooses one random unicode between 0-9 indexed from our
		unicode array.  The total combinations to be made from this is:
		10^4*21*10 = 2 100 000

		Password data looks as such
		var password = {
            numbers: int_array,
            picture: picture.toString() + ".png",
            unicode: unicode_array[unicode_num]
        }

        The created password gets a reason tied to it
        var password_combination = {
            password_data:password_array.pop(),
            reason:new_reason
        }

        It will generate three random passwords with their reasons,
        and will be stored on the server.  
	
	writeCSV():
		The writeCSV() is called when the server process is being terminated.
		It converts the our stored log data inside the data_array into 
		CSV format and appends to the data.csv file.

	logData(data):
		The logData function is called when a user has done something with the system,
		the event triggered from their action is pushed into the data_array to later be
		written to CSV.

	authenticate(user_input):
		The authenticate function handles checking the user's attempt at a password against a specific reason.
		If the correct password has been input, the function returns true.  Otherwise it returns false.


	Another major part of the server is to curate incoming messages from the client and send back
	appropriate responses.  Cases are:
		Generate: serves the three passwords to the client
		Begin: Logs when the user has begun attempting a password
		Attempt: Authenticates a users input to see if they failed or succeeded at a password attempt, logs data
		Input: Handles when the user is learning and confirming they know the passwords during the first phase
		Request: Is received when a user has loaded a new HTML page
		End: Handles when the user has finished the program
*/

var http = require('http');
var fs = require('fs');
var url = require('url');
var WebSocketServer = require('ws').Server;
var $ = jQuery = require('jquery');
require('./node_modules/jquery-csv/src/jquery.csv.js');

var ROOT_DIR = 'html';
var DATA_FILE = 'User Data/data.csv';

var data_array = new Array();	//All data to be logged is contained here
var unicode_array = ["0x1F60F", "0x1F628", "0x1F922", "0x1F47F", "0x1F44C", "0x1F44F", "0x1F5FF", "0x1F435", "0x1F346", "0x1F33D"]; //emoji array
var reason_array = ["School", "Work", "E-Mail", "Games", "Facebook", "Reddit"];	//the reasons for the passwords
var password_array = new Array();
var stored_array = new Array(); //Stores the combined password info with the reason for it
var current_reason = new Array();
var attempt_count = 0; //assigns a fail after 3 attempts
var user_id;

//Whenever the client calls a refresh or is served a new html document, the websocket closes and reconnects
//running_message must be tracked to ensure the correct messages are being sent to the client
var running_message = new Array(); 

//Mime types that may arise
var MIME_TYPES = {
    'css': 'text/css',
    'gif': 'image/gif',
    'htm': 'text/html',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'text/javascript', 
    'json': 'application/json',
    'png': 'image/png',
    'txt': 'text/plain'
};

//function parses mime type from file
var get_mime = (filename) => {
    var ext, type;
    for (ext in MIME_TYPES) {
        type = MIME_TYPES[ext];
        if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
            return type;
        }
    }
    return MIME_TYPES['txt'];
};

//HTTP SERVER CODE
var server = http.createServer((request, response) => {
	var urlObj = url.parse(request.url, true, false);
	console.log('\n============================');
    console.log("PATHNAME: " + urlObj.pathname);
    console.log("REQUEST: " + ROOT_DIR + urlObj.pathname);
    console.log("METHOD: " + request.method);

    getUserId(); //acquires correct userID for new session

    var receivedData = '';

    if(request.method == "POST") {
    	var dataObj = JSON.parse(receivedData);
    	console.log('received data object: ', dataObj);
        console.log('type: ', typeof dataObj);
        console.log("USER REQUEST: " + dataObj.text );

        var returnObj = dataObj;

        response.writeHead(200, {'Content-Type': MIME_TYPES['json']});
        response.end(JSON.stringify(returnObj));
    }

    //Handles serving all files to the client
    if(request.method == "GET") {
    	var filePath = ROOT_DIR + urlObj.pathname;

    	if(urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html';

    	fs.readFile(filePath, (err, data) => {
    		if(err){
    		  console.log('ERROR: ' + JSON.stringify(err));
              response.writeHead(404);
              response.end(JSON.stringify(err));
              return;
    		}

    		response.writeHead(200, {'Content-Type': get_mime(filePath)});
    		response.end(data);
    	});
    }

}).listen(3000);

//WEBSOCKET CODE
var wss = new WebSocketServer({server: server});
wss.on('connection', function(ws) {
	console.log("Client has connected!");

	//handles all messages coming from the client
	ws.on('message', function incoming(message){
        var incoming_message = JSON.parse(message);

        console.log('Received Socket Message: ');
        console.log(incoming_message);

        //Switch case to see which mode is being sent from the client
        switch(incoming_message.action || incoming_message[0].action) {
            case 'Generate':
                console.log("Preparing Password Information for Client");
                incoming_message.userid = user_id;
                logData(incoming_message);
                running_message = stored_array.slice();
                break;

            case 'Begin':
                console.log("Logging Appropriate Data");;
                running_message.length = 0;
                running_message = current_reason.pop();

                //Checks to see if client is finished or not
                if(running_message === undefined) {
                    console.log("Don't Send Anymore, Client is Finished");
                }else {
                    incoming_message.userid = user_id;
                    logData(incoming_message);

                    //broadcasts next reason to client, in which they will attempt the password for
                    wss.clients.forEach(function(client) {
                        client.send(JSON.stringify(running_message));
                        running_message.length = 0;
                    });
                }

                break;

            case 'Attempt':
                console.log("User has sent an attempt");
                running_message.length = 0;
                incoming_message[0].userid = user_id;
                logData(incoming_message[0]);

                if(authenticate(incoming_message[1])) {
                    running_message.length = 0;
                    running_message = "Success";
                    attempt_count = 0;
                }else {
                    running_message.length = 0;
                    attempt_count++;

                    if(attempt_count == 3) {
                        running_message = "Fail";
                        attempt_count = 0;
                    }else{
                        running_message = "Try Again";
                    }                        
                }

                var event_data = JSON.parse(JSON.stringify(incoming_message[0]));
                event_data.event = running_message;
                event_data.userid = user_id
                logData(event_data);

                //Broadcast to client indicating whether they failed or succeeded
                wss.clients.forEach(function(client) {
                    client.send(JSON.stringify(running_message));
                    running_message.length = 0;
                });

                break;

            case 'Input':
                console.log("Receiving Input Data from Client");
                running_message.length = 0;

                if(authenticate(incoming_message[1])) {
                    running_message.length = 0;
                    running_message = true;
                }else {
                    running_message.length = false;
                    running_message = false;
                }

                incoming_message[0].userid = user_id;
                logData(incoming_message[0]);

                wss.clients.forEach(function(client) {
                    client.send(JSON.stringify(running_message));
                    running_message.length = 0;
                });
                break;

            case 'Request':
                console.log("Sending Data to Client");

                incoming_message.userid = user_id;
                logData(incoming_message);
                wss.clients.forEach(function(client) {
                    client.send(JSON.stringify(running_message));
                    running_message.length = 0;
                });
                break;

            case 'End':
                console.log("Client has finished the game!");
                break;
        }
	});

    

	ws.on('close', function close() {
		console.log("Client has closed the application!");
	});
});

//Handles authenticating passwords
function authenticate(user_input) {
    var index = stored_array.findIndex(x => x.reason === user_input.reason);

    console.log(stored_array[index].password_data);
    console.log(user_input.numbers + " vs " + stored_array[index].password_data.numbers.join(""));
    console.log(user_input.picture + " vs " + stored_array[index].password_data.picture);
    console.log('0x1' + user_input.unicode.toUpperCase().slice(3) + " vs " + stored_array[index].password_data.unicode);
    
    if(user_input.numbers == stored_array[index].password_data.numbers.join("") &&
       user_input.picture == stored_array[index].password_data.picture &&
       '0x1' + user_input.unicode.toUpperCase().slice(3) == stored_array[index].password_data.unicode) 
    {
        return true;
    }else {
        return false;
    }
}

//This function will handle how log data is parsed then stored on the server
function logData(data){
	console.log("Logging Data!");
	data_array.push(data);
}

//Handles when server is terminated in the console
//Ensures data is logged into a csv file
process.on('SIGINT', function() {
	writeCSV();
});

//This function is called when a client/server has finished the program, all data is converted to csv then stored on file
function writeCSV(){
	console.log("Creating CSV File!");
	var csv_content = $.csv.fromObjects(data_array);
	console.log(csv_content);

    if(data_array.length > 0) {
        fs.appendFile(DATA_FILE, csv_content, function(err, file) {
            if (err) throw err;
            process.exit();
        }); 
    }else {
        process.exit();
    }
}

//When User first connects a password object is created for them here.  
//Will be sent to client through the initial phase
function generatePassword() {
    console.log("Generating Password for User");

    for(var j = 0; j < 3; j++) {
        var int_array = new Array(); //10^4
        var check = new Array();
        var unicode;                 //10 (Limitting ourself to only 10 different unicode characters)
        var picture;                 //21
        //10^4*10*21 = 2 100 000

        //initial 4 random numbers
        for(var i = 0; i < 4; i++) {
            int_array.push(Math.floor(Math.random()*10));
        }

        //A random identifier for the image is assigned
        picture = Math.floor(Math.random()*21);
        //A random identifier selected for the emoji unicode array 
        unicode_num = Math.floor(Math.random()*10);

        //First password object containing all information for one password
        var password = {
            numbers: int_array,
            picture: picture.toString() + ".png",
            unicode: unicode_array[unicode_num]
        }

        password_array.push(password);

    }
        
    //Shuffles the reason array 
    shuffle(reason_array);

    //Combines passwords to their random reason
    for(var x = 0; x < 3; x++) {
        var new_reason = reason_array.pop();

        var password_combination = {
            password_data:password_array.pop(),
            reason:new_reason
        }

        current_reason.push(new_reason);
        stored_array.push(password_combination);
    }

    shuffle(current_reason);
    console.log(stored_array);
}

//Fisher-Yates shuffle algorithm
function shuffle(array) {
    for(var i = reason_array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

//Gets the next userId
function getUserId() {
    console.log("HERE");

    fs.readFile(DATA_FILE, 'UTF-8', function(err, csv){
        var data = $.csv.toArrays(csv);
        var new_int = parseInt(data[data.length - 1][1].slice(6)) + 1
        user_id = 'scheme' + new_int;
    });
}

getUserId();
generatePassword();
console.log('Server Running at http://127.0.0.1:3000 CNTL-C to quit');