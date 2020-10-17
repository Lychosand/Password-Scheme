/*
Game.js is very similar to the client.js however it is only used during 
the game phase of the system.  When the user is tested on remembering the
passwords.
*/



var modal;
var span;
var target;
var reasons = new Array();
var next = false;

window.onload = function() {
	sendEvent("Begin");
	
	var form_pop = null;
	var counter = 0;


	//Handles when the server sends data
	ws.onmessage = function(message) {
		var newMsg = JSON.parse(message.data);
		//initial population of display forms
		if(form_pop == null) {
			populateForms(newMsg);
			console.log(newMsg);
			form_pop = 0;
		}

		if(next == true && counter != 3) {
			populateForms(newMsg);
			next = false;
		}else if(counter == 3) {
			console.log("You Are Finished Good Job!");
			window.location.pathname = '/index.html';
		}
		

		var elem = document.getElementById('overlay');

		//Showing user if they are correct or not
		if(newMsg == true) {
			elem.style.backgroundColor = "#42f44b";
			elem.classList.toggle('overlay-active');

		}else if(newMsg == false) {
			elem.style.backgroundColor = "#f46842";
			elem.classList.toggle('overlay-active');
		}

		switch(newMsg) {
			case "Success":
				elem.style.backgroundColor = "#42f44b";
				elem.classList.toggle('overlay-active');
				next = true;
				counter++;
				document.getElementById('overlay-content-text').innerHTML = "Click Here for a New Password";
				if(counter == 3) {
					sendEvent("End");
				}else {
					sendEvent("Begin");
				}
				break;
			case "Fail":
				elem.style.backgroundColor = "#f46842";
				elem.classList.toggle('overlay-active');
				next = true;
				counter++;
				document.getElementById('overlay-content-text').innerHTML = "Click Here for a New Password";
				if(counter == 3) {
					sendEvent("End");
				}else {
					sendEvent("Begin");
				}
				break;
			case "Try Again":
				elem.style.backgroundColor = "#f46842";
				elem.classList.toggle('overlay-active');
				document.getElementById('overlay-content-text').innerHTML = "Click Here to Try Again";
				break;
		}

		console.log("Receiving Message From Server:")
		console.log(newMsg);
	}
}

//Gets the user's input for the password
function getInput() {
	var input_password = {
		numbers:document.getElementById('int_input').value,
		picture:document.getElementById('img_input').src.slice(29),
		unicode:"0x" + document.getElementById('uni_input').innerHTML.codePointAt(0).toString(16),
		reason:document.getElementById('password').innerHTML
	}

	return input_password;
}

//Client receives an array of JSON objects in the form of passwords, this displays all the respective passwords
function populateForms(label) {
	document.getElementById('password').innerHTML = label;
}

//Fisher-Yates shuffle algorithm
function shuffle(array) {
    for(var i = reasons.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

//When user clicks on the overlay it reverses
function reset(current_overlay) {
	current_overlay.classList.toggle('overlay-active');
}

//Handling the modal when user clicks on the image to choose
function imageModal(current_image) {
	modal = document.getElementById('image_modal');
	span = document.getElementsByClassName('close')[0];
	modal.style.display = "block";

	target = current_image;

	span.onclick = function() {
 		modal.style.display = "none";
	}
}

//Get index of the image when clicked in the modal
function imageClicked(source) {
	target.src = source.id;
	modal.style.display = "none";
}

//Handling the modal when user clicks on the emoji to choose
function emojiModal(current_emoji) {
	modal = document.getElementById('emoji_modal');
	span = document.getElementsByClassName('close')[1];
	modal.style.display = "block";

	target = current_emoji;

	span.onclick = function() {
 		modal.style.display = "none";
	}
}

//Gets index of emoji when it is clicked in the modal
function emojiClicked(source) {
	target.innerText = String.fromCodePoint(unicode_array[source.id.substr(-1)]);
	modal.style.display = "none";
}

//Handles closing the modal when user clicks outside of it
window.onclick = function(event) {
	if(event.target == modal) {
		modal.style.display = "none";
	}
}