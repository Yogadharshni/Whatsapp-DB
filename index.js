// import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
const dotenv = require("dotenv");
dotenv.config()

const express = require("express");
const mongoose = require("mongoose");
const Rooms = require("./dbRooms");
const cors = require('cors')
const Messages = require("./dbMessages");
const Pusher = require("pusher");

const app = express();

const pusher = new Pusher({
    appId: "1582432",
    key: "84127ae384cf63a3b2c5",
    secret: "f87ad69d84052cf4e5df",
    cluster: "ap2",
    useTLS: true
});

// pusher.trigger("my-channel", "my-event", {
//     message: "hello world"
// });

// dotenv.config()
app.use(express.json())
app.use(cors())

// app.listen(4000)
const PORT = process.env.PORT;
const dbUrl = process.env.db_Url
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.once("open", () => {
    console.log("DB connected");
    const roomCollection = db.collection("rooms");
    const changeStream = roomCollection.watch();

    changeStream.on("change", (change) => {
        console.log(change);
        if (change.operationType === "insert") {
            const roomDetails = change.fullDocument;
            pusher.trigger("room", "inserted", roomDetails);
        } else {
            console.log("Not a expected event to trigger");
        }
    });

    const msgCollection = db.collection("messages");
    const changeStream1 = msgCollection.watch();

    changeStream1.on("change", (change) => {
        console.log(change);
        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", messageDetails);
        } else {
            console.log("Not a expected event to trigger");
        }
    });
});


app.get("/", (req, res) => {
    return res.status(200).send("Api is working");
});


app.post("/group/create", async (req, res) => {
    const name = req.body.groupName;
    try {
        const data = await Rooms.create({ name })
        return res.status(201).send(data);
    }
    catch (e) {
        console.log(e);
        return res.status(500).send(e);
    }
    // await Rooms.create({ name }, (err, data) => {
    //     if (err) {
    //         return res.status(500).send(err);
    //     } else {
    //         return res.status(201).send(data);
    //     }
    // });
});


app.post("/messages/new", async (req, res) => {
    const { name, message, timestamp, uid, roomId } = req.body;
    try {
        const data = await Messages.create({ name, message, timestamp, uid, roomId })
        return res.status(201).send(data)
    }
    catch (err) {
        return res.status(500).send(err);
    }

});


app.get("/all/rooms", async (req, res) => {
    res.json(
        await Rooms.find({})
    )
});


app.get("/room/:id", async (req, res) => {
    try {
        const data = await Rooms.find({ _id: req.params.id })
        return res.status(200).send(data[0]);
    }
    catch (err) {

        return res.status(500).send(err);
    }

});


app.get("/messages/:id", async (req, res) => {
    try {
        const data = await Messages.find({ roomId: req.params.id })
        return res.status(200).send(data);
    }
    catch (err) {

        return res.status(500).send(err);
    }

});


app.listen(PORT, () => {
    console.log(`Listening on localhost:${PORT}`);
});










