import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
// Connect to MongoDB Atlas
mongoose
  .connect(
    "mongodb+srv://mejbahasan:017%40mynet@cluster0.djyk2rw.mongodb.net/my_database",
    {
      dbName: "my_database", // Specify the database name here
    }
  )
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  })
// Define a schema
const userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log:[ {
    description: String,
    duration: Number,
    date: String,
  }]
});
// Create User model
const User = mongoose.model("User", userSchema);

// Define a route for creating new users
const createUser = async (req, res) => {
  const { username } = req.body;
  const user = new User({ username });
  await user.save();
  const _id = user._id;
  res.json({ username, _id });
};
// Define a route for getting all username and user id (only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, _id: 1 });
    res.json(users); // Assuming you want to send the users as JSON
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).send("Failed to fetch users");
  }
};
//date format to yyyy-mm-dd
/* const dateFormate = (date) => {
  let unixFormate = Date.parse(date);
  
  let newDateFormate = new Date(unixFormate);

  // Array of month names
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Array of day names
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get the day, month, and year from the input date
  const day = days[newDateFormate.getDay()];
  const month = months[newDateFormate.getMonth()];
  const year = newDateFormate.getFullYear();

  // Create the desired output string
  return (date = `${day} ${month} ${newDateFormate.getDate()} ${year}`);
}; */

// Define a function for adding exercises to database
const addExercise = (_id, description, duration, date) => {
  User.findById(_id)
    .then(user => {
      if (!user) {
        console.error("User not found");
        return;
      }
      user.log.push({ description, duration, date });
      return user.save();
    })
    .then(() => console.log("Exercise added successfully"))
    .catch(err => console.error("Error adding exercise:", err));
};

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//all users lists
app.get("/api/users", (req, res) => {
  getAllUsers(req, res);
});

// username and user id by using post method
app.post("/api/users", (req, res) => {
  createUser(req, res);
});

app.post("/api/users/:_id/exercises", (req, res) => {
  let { description, duration, date } = req.body;
  const { _id } = req.params;

  if (!date) {
    date = new Date();
  }

  date = new Date(date).toDateString();
  duration = Number(duration);

  // Get username from database and add exercise to database
  User.findById(_id)
    .then((user) => {
      if (!user) {
        res.status(404).send("User not found");
        return;
      }

      // Add exercise to user's log
      user.log.push({ description, duration, date });

      // Save user with updated log
      return user.save();
    })
    .then((updatedUser) => {
      // Return updated user object with exercise fields added
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        description,
        duration,
        date,
      });
    })
    .catch((err) => {
      console.error("Error occurred while querying the database", err);
      res.status(500).send("Internal Server Error");
    });
});

/* retrieve a full exercise log of any user */

app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  User.findById(_id)
    .then((user) => {
      if (!user) {
        res.status(404).send("User not found");
        return;
      }

      let logs = user.log;

      // Filter logs by 'from' date if provided
      if (from) {
        logs = logs.filter((log) => new Date(log.date) >= new Date(from));
      }

      // Filter logs by 'to' date if provided
      if (to) {
        logs = logs.filter((log) => new Date(log.date) <= new Date(to));
      }

      // Limit the number of logs if 'limit' is provided
      if (limit) {
        logs = logs.slice(0, Number(limit));
      }

      // Prepare response
      const response = {
        _id: user._id,
        username: user.username,
        count: logs.length,
        log: logs,
      };

      res.json(response);
    })
    .catch((err) => {
      console.error("Error occurred while querying the database", err);
      res.status(500).send("Internal Server Error");
    });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});