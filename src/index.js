import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    const port = process.env.PORT || 3000;

    app.on("error", (err) => {
      console.error("app error", err);
      throw err;
    });

    app.listen(port, () => {
      console.log(`server is running at port: ${port}`);
    });
  })
  .catch((err) => {
    console.error("DATABASE connection failed", err);
  });

/*
;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    } catch (error) {
        console.error(error)
        throw error
    }
})()
*/
