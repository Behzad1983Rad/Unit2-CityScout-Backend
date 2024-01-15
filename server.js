import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'

const app = express()

app.use(cors())
app.use(bodyParser.json())

const port = process.env.PORT || 4000

app.listen(port, () => {
    console.log(`Listenig on port: ${port}`)
})

app.get('/', (req, res) => {
    res.json({message: "Server running"})
})

mongoose.connect(process.env.DATABASE_URL)

const tripSchema = new mongoose.Schema({
    destination: String,
    dateOfArrival: Number,
    duration: Number,
    cost: Number,
    
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

app.get('/trip', async (req, res) => {
    const allTrips = await Trip.find({})
    res.json(allTrips)
})

app.post('/trip/new', (req, res) => {
    const myTrip = new Trip(req.body)
    myTrip.save()
    .then(() => {
        console.log("Trip Saved")
        res.sendStatus(200)
    })
    .catch((error) => {
        console.error("Error saving trip:", error);
        res.sendStatus(500);
    });
})

app.get('/trip/:id', async (req, res) =>{
    const trip = await Trip.findById(req.params.id)
    res.json(trip)
})



app.put('/trip/:id' , (req, res)=> {
    Trip.updateOne({"_id": req.params.id}, { destination: req.body.destination, dateOfArrival: req.body.dateOfArrival, 
        duration: req.body.duration, cost: req.body.cost })
    .then(() => {
        res.sendStatus(200)
    })
    .catch(() => {
        res.sendStatus(500)
    })
})

app.delete('/trip/:id' , (req, res) =>{
    Trip.deleteOne({"_id": req.params.id})
    .then(() => {
        res.sendStatus(200)
    })
    .catch(() => {
        res.sendStatus(500)
    })
})


app.post('/user/login' , async (req, res) => {
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

