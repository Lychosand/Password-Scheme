#Important Javascript Files
server.js 		= handles hosting the server in which the client will connect to
html/message.js = handles curating all events the user is generating and sends to the server
html/client.js 	= handles opening and viewing passwords during the first phase
html/game.js 	= handles the game phase of the system where users attempt to unput passwords for the specific reason


#Required Modules
For this program to work you will need a few modules to run the program
All work is done on Windows 10, using chrome as the browser
If node modules are already present in file, simply install Node.js
Note that the modules themselves are included, you can skip to the running 
program portion.  These steps are in case the modules, for whatever reason,
are not appearing in the files.  

1. Install Latest version of Node.js
2. Open terminal
3. navigate to where `Password Scheme/server.js` is
4. run `npm i ws`
5. run `npm i jquery`
6. run `npm i jquery-csv`

#Running Program
The way in which the application setup is client-server structure using javascript
In order to setup the application

1. Open terminal 
2. navigate to where `Project 2/Part 2/Password Scheme/server.js` is
3. run `node server.js`
4. Open a tab in chrome
5. go to `http://127.0.0.1:3000`
6. follow instructions and use the application
7. after you have exhausted the 3 passwords, either failing or succeeding the program will be finished
8. note that after the third password has been exhausted, simply press the check button again and it will return
you to the beginning (this is not necessary, your data has been logged).
9. to ensure that the data is appropriately logged, close the server by pressing `ctrl-c` on the active terminal
after you've finished your attempts.
10. If you wish to view the data associated with your attempt, go to `User Parse/data.csv`.  Your data
will append to the bottom of the csv file.
11. If you wish to parse said data, follow the instructions inside `Data Parse`
