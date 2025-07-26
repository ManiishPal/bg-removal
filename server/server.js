import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import connectDB from './configs/mongodb.js';
import userRouter from './routes/userRoute.js';
import imageRouter from './routes/imageRoute.js';


//app config
const PORT = process.env.PORT || 4000
const app = express()
await connectDB();

//Initialize middlewares
app.use(express.json())
app.use(cors())

//api routes
app.get('/', (req,res) => res.send("API Working"))
app.use('/api/user', userRouter)
app.use('/api/image', imageRouter )

app.listen(PORT, () => console.log("Server running on port "+PORT))