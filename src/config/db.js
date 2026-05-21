import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB Atlas connected successfully ✅");
  } catch (error) {
    console.log("Error while connecting MongoDB Atlas:", error.message);
    process.exit(1);
  }
};

export { connectDB };
