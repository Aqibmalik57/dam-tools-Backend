import mongoose from "mongoose";

const mongoDb = () => {
  mongoose.connect(process.env.Mongodb_Url).then(() => {
    console.log("connected to Database");
  });
};

export default mongoDb;
