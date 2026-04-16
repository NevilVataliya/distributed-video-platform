import mongoose from "mongoose";
import { DB } from "../constants.js";

const connectDB = async() =>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log(`Mongo connected ${connectionInstance.connection.host}`)
    }
    catch(error){
        console.log("Mongo connection failed ",error)
        process.exit(1);
    }
}
export default connectDB;