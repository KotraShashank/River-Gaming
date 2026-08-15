import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (err) {
    console.log(`Error connecting: ${err}`);
    process.exit(1);
  }
};

export default connectDB;
