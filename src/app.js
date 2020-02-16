const path = require('path')
const express = require('express')
const hbs = require('hbs')
const geocode = require('./utils/geocode')
const forecast = require('./utils/forecast')

const app = express()

//view engine
const viewsPath = path.join(__dirname, '../templates/views')
app.set('view engine', 'hbs')
app.set('views', viewsPath)
const partialsPath = path.join(__dirname, '../templates/partials')
hbs.registerPartials(partialsPath)

//serve public path folder
const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath))

app.get('', (req, res) => {
    res.render('index', {
        title: 'Weather app',
        name: 'Kappyz0r'
    })
})

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'Weather app - About',
        name: 'Kappyz0r'
    })
})

app.get('/help', (req, res) => {
    res.render('help', {
        title: 'Weather app - Help',
        helpMessage: 'This is a help message',
        name: 'Kappyz0r'
    })
})

app.get('/weather', (req, res) => {
    const { address } = req.query

    if(!address){
        return res.send({
            error: "No address specified"
        })
    }

    geocode(address, (error, coordinates) => {
        if(error) {
            return res.send({
                error
            })
        }

        forecast(coordinates, (error, forecastPrediction) =>{
            if (error) {
                return res.send({
                    error
                })
            }

            res.send({
                location: coordinates.name,
                forecastPrediction
            })
        })
    })
})


app.get('/help/*', (req, res) => {
    res.render('notFound', {
        title: 'Weather app - Help',
        errorMessage: 'Help Article not found',
        name: 'Kappyz0r'
    })
})

app.get('*', (req, res) => {
    res.render('notFound', {
        title: 'Weather app - Help',
        errorMessage: 'This is not the page you\'re looking for',
        name: 'Kappyz0r'
    })
})

const port = 3000
app.listen(port, () => {
    console.log('Server is running on port ' + port)
})