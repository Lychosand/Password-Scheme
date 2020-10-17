/*
This software handles parsing the user input csv data into 
a statistical analysis data set.  It focuses on finding
the total attempts/successes/failures and the average
success/fail time that each individual user logged during
testing.

Logical Flow:
	Read data.csv
	convert csv data to array
	call function Parser
	move user JSON objects into an array
	convert users array into csv format
	write to parseddata.csv

Functions:
	parser(data, users, scheme):
		input:
			data: csv data in the form of an array
			users: the array in which will be populated by user data
			scheme: the name of our scheme

		output:
			Users is populated with user objects
			User objects look as such

			var user = {
				user_id: anchor,
				scheme: scheme,
				login_attempts: 0,
				login_successes: 0,
				login_failure: 0,
				average_success_time: 0,
				average_fail_time: 0,
				total_success_time: 0,
				total_fail_time: 0
			};


		The only important function in this program.  It loops
		through all rows of the data member until it has been exhausted.
		It specifically looks for events when a user has begun their test
		for a specific password.  It counts all attempts/fails/successes.
		It takes the time between the user beginning a password and either
		the fail/success.  This time is summed for their total time.
		Afterwards the average is taken as (time of success/total successes).
		Once finished with all of the user's data, the user object is
		pushed to an array.
*/

console.log("Parsing CSV File");

var fs = require('fs');
var $ = jQuery = require('jquery');
require('./jquery.csv.js');

var DATA_FILE = '../User Data/data.csv';

var schemer_users = new Array();	//Array in which to store our user objects

//First read the data.csv file that will be parsed
fs.readFile(DATA_FILE, 'UTF-8', function(err, csv) {
	var data = $.csv.toArrays(csv); //uses the jquery-csv module to turn csv data into an array
	parser(data, schemer_users, 'schemer');	//calls our parse function to do all application logic.

	var csv_content = $.csv.fromObjects(schemer_users); //uses jquery-csv module to turn our objects into appopriate csv format.

	//Writing our parsed data to parseddata.csv
	fs.writeFile('../User Data/parseddata.csv', csv_content, function(err, file) {
		if(err) throw err;
		console.log("New CSV File Created!");
	});
});

//Handles extracting usefull information from the user data set.
function parser(data, users, scheme) {
	var index = 0; 
	var anchor = null; //anchor will be used as the userID to check if a new user should be created.
	var start_time = null; //start time will be used when a user begins a password

	while(data[index]) {

		//If a new user has arrived, create a new user object
		if(data[index][1] != anchor) {
			//Removes irrelevant data
			if(data[index][1] == 'userid' || data[index][1] == 'scheme1'){
				index++;
				continue;
			}

			anchor = data[index][1];	//sets anchor to new userid

			var user = {
				user_id: anchor,
				scheme: scheme,
				login_attempts: 0,
				login_successes: 0,
				login_failure: 0,
				average_success_time: 0,
				average_fail_time: 0,
				total_success_time: 0,
				total_fail_time: 0
			};
		}

		//Switch case checks for specfic events in the data
		switch(data[index][4]) {
			//case for when the user begins a new password
			case "Begin":
				start_time = new Date(data[index][0]);
				break;

			//case for when a user has attempted a password
			case "Attempt":
				//Ensures that we are only checking after a user has begun a password
				if(start_time != null) {
					//Switch case checks for fails/attempts/successes
					switch(data[index][5]) {
						case "Try Again":
							user.login_attempts++;
							break;

						case "Fail":
							var end_time = new Date(data[index][0]);
							var time_diff = Math.abs(end_time.getTime() - start_time.getTime());	//acquire time to completion
							time_diff = time_diff/1000;	//converts to seconds

							user.total_fail_time += time_diff;

							user.login_attempts++;
							user.login_failure++;
							start_time = null;
							break;

						case "Success":
							var end_time = new Date(data[index][0]);
							var time_diff = Math.abs(end_time.getTime() - start_time.getTime());
							time_diff = time_diff/1000;

							user.total_success_time += time_diff;

							user.login_attempts++;
							user.login_successes++;
							start_time= null;
							break;
					}
				}
				break;
		}

		//Switch case for when data is at the end or a new user is incoming
		//Also calculates average time for successes/fails
		switch(true) {	
			//pushes new user to array if at the end of the data set
			case (index+1 == data.length):
				if(user.login_failure != 0)
					user.average_fail_time = (user.total_fail_time/user.login_failure).toFixed(3);
				if(user.login_successes != 0)
					user.average_success_time = (user.total_success_time/user.login_successes).toFixed(3);

				if(user.total_success_time == 0){
					user.average_success_time = 0;
				}else {
					user.total_success_time = user.total_success_time.toFixed(3);
				}

				if(user.total_fail_time == 0) {
					user.average_fail_time = 0;
				}else {
					user.total_fail_time = user.total_fail_time.toFixed(3);
				}

				users.push(user);
				break;

			//pushed new user to array if a new user is incoming
			case (index+1 < data.length-1):
				if(data[index+1][1] != anchor) {
					if(user.login_failures != 0)
						user.average_fail_time = (user.total_fail_time/user.login_failure).toFixed(3);
					if(user.login_successes != 0)
						user.average_success_time = (user.total_success_time/user.login_successes).toFixed(3);

					if(user.total_success_time == 0){
						user.average_success_time = 0;
					}else {
						user.total_success_time = user.total_success_time.toFixed(3);
					}

					if(user.total_fail_time == 0) {
						user.average_fail_time = 0;
					}else {
						user.total_fail_time = user.total_fail_time.toFixed(3);
					}					

					users.push(user);
				}
				break;
		}

		index++;
	}
}