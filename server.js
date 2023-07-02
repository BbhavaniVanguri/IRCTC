
/** Importing Express module */
const express = require("express");  

/** Creating a server object */
const app = express();

/** Importing fs module and creating fs object*/
const fs = require("fs");

/** Importing mysql module and creating mysql object */
let mysql = require("mysql");

/** Importing MongoDB module and creating MongoClient object */
let MongoClient = require('mongodb').MongoClient;

/** Specify a MongoDB connection URL with the correct ip address and the name of the database if database doesn't exist it will create a new database*/
let url = "mongodb+srv://bbhavani:bbhavani@cluster0.n2ecs6h.mongodb.net/";  //creating a databse called trainsData

/** Creating a PORT */
const PORT = 4500;

/** The server object app listens on port 4500*/
app.listen(PORT, () => console.log(`listening at http://localhost:${PORT}`));

/** To serve static files such as images, CSS files, and JavaScript files, use the express.static built-in
middleware function in Express.*/
app.use(express.static("public"));                 //The app.use() function adds a new middleware to the app

/** The express.json() function is a built-in middleware function in Express. It parses incoming requests with JSON payloads */
app.use(express.json());        

/*****************MONGODB CONNECTION**********************/

/**
 * To create MongoDB Database connection
 * @param {string} url
 * @param {method} function
 */
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});

url="mongodb+srv://bbhavani:bbhavani@cluster0.n2ecs6h.mongodb.net/";

/**
 * To create a new GET type rest request to access all train documents from MongoDB database collection.
 * @param {string} "/trainsDetails" - RestAPI call
 * @param {Method} function
 */

MongoClient.connect(url, function (err, client) {
  if (err) throw err;
  const db = client.db("mydb");

  // Check if the collection exists
  db.listCollections({ name: "trainsData" }).toArray(function (err, collections) {
    if (err) throw err;

    // If the collection doesn't exist, create it and insert data
    if (collections.length === 0) {
      const collection = db.collection("trainsData");

      const fs = require("fs");
      const fileName = "trainsData.json";

      // Read the JSON file
      fs.readFile(fileName, "utf8", (err, data) => {
        if (err) throw err;
        const jsonData = JSON.parse(data);

        // Insert the data into the collection
        collection.insertMany(jsonData, (err, result) => {
          if (err) throw err;
          console.log("Collection created and data inserted successfully");
          client.close();
        });
      });
    } else {
      client.close();
    }
  });
});


app.get("/trainsDetails", (req, res) => {
  /**
   * To select data from a documents in MongoDB using find method. To create MongoDB query to fetch data from database and send json data to client as response object
   * @param {string} url - MongoDB connection url
   * @param {Method} function
   */
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.collection("trainsData").find({}).toArray(function(err, result) {
      if (err) throw err;
      //console.log(result);
      res.end(JSON.stringify(result));
      db.close();
    });
  });
  });


/**
 * This rest api would be a POST type because It will post some JSON data to server.
 * @param {string} "/trainsDetails/:trainName"  - RestAPI call
 * @param {Method} Arrowfunction
 */
app.post("/trainsDetails/:trainName", (req, res) => {
  const trainName = req.body.trainName;
  const stationIndex = req.body.StationIndex;
  const UpdatedSeats = req.body.UpdatedSeats;
  const dateIndex=req.body.dateIndex;
  const time=req.body.time;

/**
 * To update seats availablity field of a particular train in MongoDB document using rest api. 
 * @param {string} url - MongoDB connection url
 * @param {Method} function
 */
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    let dbo = db.db("mydb");

    let myquery = { 'train_name': trainName,[`junctions.${stationIndex}.Time`]:time};
    let newvalues = {$set: {[`junctions.${stationIndex}.Available_Seat.${dateIndex}`]: UpdatedSeats}};

    dbo.collection("trainsData").updateOne(myquery, newvalues, function(err, res) {
      if (err) throw err;
      console.log("1 document updated");
      db.close();
    });

  });
});


/***************SQL CONNECTION**********************/

/** To Create database connection */
let connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "IRCTC",
});


/**
 * To Connect to database
 * @param {method} function
 */
connection.connect(function (err) {
  if (err) throw err;
  console.log("You are now connected...");
});

/**
 * To send booked trains data into booked_traindetails table into MYSQL database using POST method
 * @param {string} "/bookedTraindata" - RestAPI call
 * @param {Method} function
 */
app.post("/bookedTraindata",(req, res) => {
  const newBookingTrainDetails = {
    pnrnumber: req.body.pnrnumber1,
    trainname: req.body.trainname,
    source: req.body.source,
    sourcedatetime: req.body.sourcedatetime,
    destination: req.body.destination,
    destinationdatetime: req.body.destinationdatetime,
  };

  //Insert query to insert new booked_traindetails data into table
  let sqlTraindetails = "INSERT INTO booked_traindetails SET ?";
  let query = connection.query(sqlTraindetails, newBookingTrainDetails, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });

});

/**
 * To send booked passengers data into booked_passengerdetails table in MYSQL database using POST method
 * @param {string} "/bookedpassengersdata" - RestAPI call
 * @param {method} ArrowFunction
 */
app.post("/bookedpassengersdata", (req, res) => {
  const newBookingPassengerDetails = {
    pnrnumber1: req.body.pnrnumber1,
    passengername: req.body.passengername,
    passengerage: req.body.passengerage,
    passengergender: req.body.passengergender,
    passengerseat: req.body.passengerseat,
    passengerstatus: req.body.passengerstatus,
    passengerseatnumber: req.body.passengerseatnumber,
  };
  let sqlPassengerDetails = "INSERT INTO booked_passengerdetails SET ?";
  let query = connection.query(sqlPassengerDetails,newBookingPassengerDetails,
    (err, results) => {
      if (err) throw err;
      res.send(JSON.stringify(results));
    }
  );
});


/**
 * To get train deatils and passenger details by PNR number uisng POST method
 * @param {string} "/bookedpassengersdata/:pnrnumber" - RestAPI call
 * @param {method} ArrowFunction
 */
app.get("/bookedpassengersdata/:pnrnumber", (req, res) => {
  //SQL query to select passenger details using PNR Number
  connection.query(
    "SELECT bt.pnrnumber,bt.trainname,bt.source,bt.destination,bt.sourcedatetime,bp.passengername,bp.passengerage,bp.passengergender,bp.passengerstatus,bp.passengerseat,bp.passengerseatnumber FROM booked_traindetails bt JOIN booked_passengerdetails bp ON (bp.pnrnumber1=bt.pnrnumber) where pnrnumber=?",
    [req.params.pnrnumber],
    function (error, results, fields) {
      if (error) throw error;
      res.end(JSON.stringify(results));
    }
  );
});


/**
 * To update booked passenger details after cancellation by pnrnumber by PUT method
 * @param {string} "/bookedpassengersdata/:pnrnumberCancel" - RestAPI call
 * @param {any} (req
 * @param {any} res
 * @returns {any}
 */
app.put("/bookedpassengersdata/:pnrnumberCancel", (req, res) => {
  const newBooking = {
    pnrnumber1:req.body.pnrnumber,
    passengerseat:req.body.CancelBerth,
    passengername:req.body.CancelName,
    passengerseatnumber:req.body.CancelSeatNo,
    passengerstatus:req.body.CancelStatus
  };

  //SQL query to update passenger details by PNR number
  let sql="UPDATE booked_passengerdetails SET passengerseat='"+req.body.CancelBerth+"', passengerseatnumber='"+req.body.CancelSeatNo+ "', passengerstatus='"+req.body.CancelStatus+ "' WHERE pnrnumber1='"+req.body.pnrnumber+"' AND passengername='"+req.body.CancelName+"'";
  
  let query = connection.query(sql,(err, results) => {
    if (err) throw err;
    res.send(JSON.stringify(results));
  });
});