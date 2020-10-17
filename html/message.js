/*
This file handles curating events sent out from the client and ensures the appopriate data
is sent to the server.  Essentially acting as a middle man.

Logical Flow:
	User does something
	Event is triggered
	Log data is formed from the event
	Sends event to the server

Functions:
	sendEvent(message, index):
		handles sending the specific event to the server

	eventHandler(e_date, e_userid, e_scheme, e_website, e_action, e_event):
		created appropriate JSON object for the given event.  This object is what
		is being sent to the server
*/

var ws = new WebSocket('ws://' + window.document.location.host);

var unicode_array = ["0x1F60F", "0x1F628", "0x1F922", "0x1F47F", "0x1F44C", "0x1F44F", "0x1F5FF", "0x1F435", "0x1F346", "0x1F33D"]; //emoji array

//Function here will have to handle the event flow to the server
//We must send different events for according to what the client has done
function sendEvent(message, index){
	console.log("Sending Event");
	console.log(message);
	switch(message) {
		case "Log Event":
			var log_data = eventHandler(new Date(), null, "Password Scheme", "Schemer", "Begin", "Success");
			ws.send(JSON.stringify(log_data));
			break;

		case "Generate":
			console.log("Generating");
			var log_data = eventHandler(new Date(), null, "Password Scheme", "Schemer", "Generate", "Success");
			ws.send(JSON.stringify(log_data));
			break;

		case "Input":
			var log_data = eventHandler(new Date(), null, "Password Scheme", "Schemer", "Input", null);
			var user_input = getInput(index);
			var temp = [log_data, user_input];
			ws.send(JSON.stringify(temp));
			break;

		case "Attempt":
			var log_data = eventHandler(new Date(), null, "Password Scheme", "Schemer", "Attempt", null);
			var user_input = getInput();
			var temp = [log_data, user_input];
			ws.send(JSON.stringify(temp));
			break;

		case "Request":
			var log_data = eventHandler(new Date(), null, "Password Scheme", "Schemer", "Request", null);
			ws.send(JSON.stringify(log_data));
			break;

		case "Begin":
			var log_data = eventHandler(new Date(), null, "Password Scheme", "Schemer", "Begin", null);
			ws.send(JSON.stringify(log_data));
			break;
		}

}

//Creates the event that will be logged on the server
function eventHandler(e_date, e_userid, e_scheme, e_website, e_action, e_event) {
	var event_data = {
		date:e_date,
		userid:e_userid,
		scheme:e_scheme,
		website:e_website,
		action:e_action,
		event:e_event
	}

	return event_data
}