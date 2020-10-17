/*
Client.js is the active file for when the user is going through the beginning phase
of generating and accepting the three passwords.

Functions:
	getInput(index)
	populateForms(passwords)
	imageModal(current_image)
	imageClicked(source)
	emojiModal(current_emoji)
	emojiClicked(soursce)
	rest(current_overlay)

	getInput(index):
		getInput handles parsing the user input for the specific password

	populateForms(passwords):
		when the client has received the three randomly generated passwords this 
		ensures they are displayed correctly on the webpage

	imageModal(current_image):
		displays the 21 images to choose from when the client clicks on the image input

	imageClicked(source):
		determines which image has been clicked for the specific password

	emojiModal(current_emoji):
		display the 10 emojis to choose from when the client clicks on the image input

	emojiClicked(source):
		determines which emoji has been clicked for the specific password

	reset(current_overlay):
		resets the overlay overtop of the failed/succeeded password 

*/

var modal;
var span;
var target;
var current_frame;
var check_array = [false, false, false];

//Gets the user's input for the password
function getInput(index) {
	var input_password = {
		numbers:document.getElementById('int_input' + index).value,
		picture:document.getElementById('img_input' + index).src.slice(29),
		unicode:"0x" + document.getElementById('uni_input' + index).innerHTML.codePointAt(0).toString(16),
		reason:document.getElementById('password' + index).innerHTML
	}

	current_frame = index;
	return input_password;
}



window.onload = function() {
	sendEvent("Request");
	
	var form_pop = null;
	var counter = 0;


	//Handles when the server sends data
	ws.onmessage = function(message) {
		var newMsg = JSON.parse(message.data);

		//initial population of display forms
		if(form_pop == null) {
			populateForms(newMsg);
			form_pop = 0;
		}

		var elem = document.getElementById('overlay' + current_frame);

		//Showing user if they are correct or not
		if(newMsg == true) {
			counter++;
			elem.style.backgroundColor = "#42f44b";
			elem.classList.toggle('overlay-active');
			check_array[current_frame] = true;

			if(check_array.every(function(current_value) {return current_value == true})) {
				console.log("All Three correct!");
				document.getElementById('generate_next').style.visibility = "visible"
			}

		}else if(newMsg == false) {
			check_array[current_frame] = false;
			elem.style.backgroundColor = "#f46842";
			elem.classList.toggle('overlay-active');
			document.getElementById('generate_next').style.visibility = "hidden"
		}

		console.log("Receiving Message From Server:")
		console.log(newMsg);
	}

}

//Client receives an array of JSON objects in the form of passwords, this displays all the respective passwords
function populateForms(passwords) {
	for(var i = 0; i < 3; i++) {
		document.getElementById('password' + i).innerHTML = passwords[i].reason;
		document.getElementById('int' + i).innerHTML = passwords[i].password_data.numbers.join("");
		document.getElementById('img' + i).src = 'images/' + passwords[i].password_data.picture;
		document.getElementById('uni' + i).innerHTML = String.fromCodePoint(passwords[i].password_data.unicode);
	}

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

//When user clicks on the overlay it reverses
function reset(current_overlay) {
	current_overlay.classList.toggle('overlay-active');
}
