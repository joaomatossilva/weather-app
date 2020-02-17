const path = require('path')
const express = require('express')
const hbs = require('hbs')
const geocode = require('./utils/geocode')
const forecast = require('./utils/forecast')
const { initTracer, ZipkinB3TextMapCodec } = require('jaeger-client')
const { Tags, FORMAT_HTTP_HEADERS } = require('opentracing')
const request = require('request')

const app = express()
const port = process.env.PORT || 3000

//init tracing
var config = {
    serviceName: 'my-awesome-service',
    sampler:{
        type: 'const',
        param: 1

    },
    reporter: {
        agentHost: 'localhost',
        agentPort: 6832,
        logSpans: true,
        agentSocketType: 'udp4',
        flushIntervalMs: 1000
    }
    
};


var options = {
    tags: {
        'my-awesome-service.version': '1.1.2',
    },
    //debug logger to output to the console
    logger: {
        info: msg => {
          console.log("INFO ", msg);
        },
        error: msg => {
          console.log("ERROR", msg);
        }
      }
};
var tracer = initTracer(config, options);

//register the zipking headers injectors and exctracters
let codec = new ZipkinB3TextMapCodec({ urlEncoding: true });
tracer.registerInjector(FORMAT_HTTP_HEADERS, codec);
tracer.registerExtractor(FORMAT_HTTP_HEADERS, codec);

//view engine
const viewsPath = path.join(__dirname, '../templates/views')
app.set('view engine', 'hbs')
app.set('views', viewsPath)
const partialsPath = path.join(__dirname, '../templates/partials')
hbs.registerPartials(partialsPath)

//serve public path folder
const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath))

//register a global span for each request
app.use('', (req, res, next) => {
    //inherit the headers from the request
    const wireCtx = tracer.extract(FORMAT_HTTP_HEADERS, req.headers)

    const span = tracer.startSpan(req.url, { childOf: wireCtx })
    span.setTag(Tags.HTTP_URL, req.url)
    span.setTag(Tags.HTTP_METHOD, req.method)

    //add context to the request
    req.tracingContext = { span }

    req.on('end', () => {
        span.finish()
    });

    try {
        next()
    }
    catch (error) {
        span.setTag('error', true)
        span.setTag('error.message', error.message)
    }    
})

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

//test endpoint
app.get('/test', (req, res) => {

    const uri = 'http://localhost:3000/weather?address=Ramada'
    const method = 'GET'
    const headers = {}

    const span = tracer.startSpan('http_request', { childOf: req.tracingContext.span.context() })
    span.setTag(Tags.HTTP_URL, uri)
    span.setTag(Tags.HTTP_METHOD, method)

    tracer.inject(span, FORMAT_HTTP_HEADERS, headers)

    request({ uri, method, headers }, (err, response) => {
        // Error handling
        if (err) {
          span.setTag(Tags.ERROR, true)
          span.setTag(Tags.HTTP_STATUS_CODE, err.statusCode)
          span.log({
            event: 'error',
            message: err.message,
            err
          })
          span.finish()
          return
        }
      
        // Finish span
        span.setTag(Tags.HTTP_STATUS_CODE, response.statusCode)
        span.finish()
        res.send(response.body)
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

app.listen(port, () => {
    console.log('Server is running on port ' + port)
})