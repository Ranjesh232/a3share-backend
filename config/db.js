require('dotenv').config();
const mongoose = require('mongoose');

function connectDB() {
    //Connecting to database...
    mongoose.connect(process.env.MONGO_CONNECTION_URL, {
        useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true,
        useFindAndModify: true
    });
    const connection = mongoose.connection;

    connection.once('open', () => {
        console.log("Connection successful");
    }).catch(err => {
        console.log("Connection error occured!");
    });

}

module.exports = connectDB;