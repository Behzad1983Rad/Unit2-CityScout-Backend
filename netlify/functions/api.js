import 'dotenv/config'
import express , {Router} from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import serverless from 'serverless-http'

import { HolidayAPI } from 'holidayapi';


const api = express()
api.use(cors())
api.use(bodyParser.json())

// const key = process.env.HOLIDAY_API_KEY;

const holidayApi = new HolidayAPI({ key })

const router = Router()


router.get('/countries', async (req, res) => {
    const searchString = req.query.search
    try {
      const countries = await holidayApi.countries({
        search: searchString
      });
      res.json(countries);
    } catch (error) {
      console.error('Error fetching countries:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });




router.get('/', (req, res) => {
    res.json({message: "Server running"})
})

mongoose.connect(process.env.DATABASE_URL)

const tripSchema = new mongoose.Schema({
    destination: String,
    dateOfArrival: Number,
    duration: Number,
    cost: Number,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
    
    
})

const userSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    lastLogin: { 
        type: Date,
        required: true
    }
})

const Trip = mongoose.model('Trip', tripSchema)
const User = mongoose.model('User', userSchema)





router.get('/trip', async (req, res) => {
    const userEmail = req.headers['user-email'];
    const user = await User.findOne({ userEmail });

    if (user) {
        console.log(user)
        const userTrips = await Trip.find({ user }).populate('user');
        res.json(userTrips);
    } else {
        console.log('Not found')
        res.status(404).json({ message: "User not found" });
    }
});

router.post('/trip/new', async (req, res) => {
    const userEmail = req.headers['user-email'];
    const user = await User.findOne({ userEmail });
    console.log(userEmail)

    if (user) {
        const myTrip = new Trip({
            destination: req.body.destination,
            dateOfArrival: req.body.dateOfArrival,
            duration: req.body.duration,
            cost: req.body.cost,
            user: user
        });

        myTrip.save()
            .then(() => {
                console.log("Trip Saved");
                res.sendStatus(200);
            })
            .catch((error) => {
                console.error("Error saving trip:", error);
                res.sendStatus(500);
            });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});




router.get('/trip/:id', async (req, res) =>{
    const trip = await Trip.findById(req.params.id)
    res.json(trip)
})




router.put('/trip/:id' , (req, res)=> {
    Trip.updateOne({"_id": req.params.id}, { destination: req.body.destination, dateOfArrival: req.body.dateOfArrival, 
        duration: req.body.duration, cost: req.body.cost })
    .then(() => {
        res.sendStatus(200)
    })
    .catch(() => {
        res.sendStatus(500)
    })
})

router.delete('/trip/:id' , (req, res) =>{
    Trip.deleteOne({"_id": req.params.id})
    .then(() => {
        res.sendStatus(200)
    })
    .catch(() => {
        res.sendStatus(500)
    })
})


router.post('/user/login' , async (req, res) => {
    const now = new Date()

    if (await User.countDocuments({"userEmail" : req.body.userEmail}) === 0) {
        const newUser = new User({
            userEmail: req.body.userEmail,
            lastLogin: now
        })
        newUser.save()
        .then (() => {
            res.sendStatus(200)
        })
        .catch (err => {
            res.sendStatus(500)
        })
    }
    else {
        await User.findOneAndUpdate ({"userEmail": req.body.userEmail}, {lastLogin: now})
        res.sendStatus(200)
    }
})

export const handler = serverless(api)





