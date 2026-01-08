require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const config = require("../src/config/env");

async function checkUser() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log("Connected to MongoDB");

    const user = await User.findOne({ email: "bhanu@gmail.com" });
    if (user) {
      console.log("User found:");
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();