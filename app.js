const express = require("express");
const app = express();
app.use(express.json());

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const db_file_path = path.join(__dirname, "./twitterClone.db");

// related to connecting to database using open method
// -------->>>>   1st step <<<<<------------------
let db = null;
const connectToDBInitializeServer = async () => {
  try {
    db = await open({
      filename: db_file_path,
      driver: sqlite3.Database,
    });
    console.log("connected to database");
    app.listen(3000, () => {
      console.log(`Connected in port ${3000}`);
    });
  } catch (e) {
    console.log(e.message);
  }
};

connectToDBInitializeServer();
// ---------------->>>>>         1st step connecting to db and initializing server completed <<<<<<-----------------

// ----->>>>    Path for registering users
const validateRegistrationRequest = async (req, res, next) => {
  let status = null;
  let msg = null;
  const { username, password, name, gender } = req.body;
  const gettingUserFromDbQuery = `SELECT * FROM user where username = '${username}' `;
  try {
    const usersFromDbWithGivenUsername = await db.get(gettingUserFromDbQuery);
    //console.log(usersFromDbWithGivenUsername);
    if (usersFromDbWithGivenUsername !== undefined) {
      //res.status(400).send("User already exists");
      status = 400;
      msg = "User already exists";
    } else {
      // if user doesn't exist , then we try to add user with validated password
      // performing password validation
      console.log("user doesn't exist , validating password");
      if (password.length < 6) {
        //res.status(400).send("Password is too short");
        status = 400;
        msg = "Password is too short";
        console.log("password is too short");
      } else {
        // creating hashed password for storing password
        const hashedPassword = await bcrypt.hash(password, 10);
        // res.status(200).send("User created successfully");
        // inserting the user into database

        const addingUserIntoDbQuery = `INSERT INTO USER(name , username , password , gender)
         VALUES ('${name}' , '${username}' , '${hashedPassword}'  , '${gender}') `;
        const addingUserPromise = await db.run(addingUserIntoDbQuery);
        status = 200;
        msg = "User created successfully";
        console.log("user created successfully");
        console.log(addingUserPromise.lastId);
      }
    }
  } catch (e) {
    console.log(e.message);
  }
  req.status = status;
  req.msg = msg;
  next();
  // const usersFromDbWithGivenUsername = db.all(gettingUserFromDbQuery);
};

app.post("/register/", validateRegistrationRequest, (req, res) => {
  const { status, msg } = req;
  res.status(status).send(msg);
});

// ------------>>>>> Procedure for Registration request completed <<<<<<--------------------------------------

// 2) Path for login  ------>>>>>   2nd Step , Login Started <<<<<-------------------------

// a middleware to check if user exits , then sending JWT token
const sendingJWTForValidUsers = async (req, res, next) => {
  const { username, password } = req.body;
  const gettingUserWithQuery = `SELECT * FROM user where username = '${username}' `;
  const dbUser = await db.get(gettingUserWithQuery);
  if (dbUser === undefined) {
    res.status(400).send("Invalid user");
  } else {
    // verifying password using bcrypt
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password);
    if (isPasswordCorrect) {
      //password is correct , so sending the jwt token
      const payLoad = { username: username, user_id: dbUser.user_id };
      const generatedToken = await jwt.sign(payLoad, "SECRET_TOKEN");
      console.log("went upto generatedToken");
      res.status(200).send({ jwtToken: generatedToken });
      next();
    } else {
      res.status(400).send("Invalid password");
    }
  }
};

app.post("/login/", sendingJWTForValidUsers, (req, res) => {
  console.log("successfully completed login request");
});

// 2) ----->>>> Completed <<<<<--------

// Defining Middleware to check for JWT token
const verifyJwtToken = (req, res, next) => {
  const authLine = req.headers["authorization"];
  if (authLine === undefined) {
    res.send("jwt not sent");
  } else {
    const token = authLine.split(" ")[1];
    console.log(jwt);
    if (jwt === undefined) {
      res.send("token not sent");
    } else {
      jwt.verify(token, "SECRET_TOKEN", async (error, payload) => {
        if (error) {
          res.status(400).send("Invalid Token");
        } else {
          const { username, user_id } = payload;
          req.username = username;
          req.user_id = user_id;
          // res.send({ username, response: "ok" });
          next();
        }
      });
    }
  }
};

app.get("/verifying/", verifyJwtToken, (req, res) => {
  console.log("end of verification");
});

app.get("/user/tweets/feed/", verifyJwtToken, (req, res) => {
  const { username, user_id } = req;
  // getting latest tweets of other people whom the present user follows

  /* user_id in USER table linked to follower_id in FOLLOWER table 
and linked to following_userid in FOLLOWER tablr to user_id in TWEET table */

  const msg = `content is requested by ${username} with id ${user_id}`;
  res.send({ msg });
});

exports.default = app;
