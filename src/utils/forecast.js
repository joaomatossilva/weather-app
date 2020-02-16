const request = require('request')

const forecast = ({latitute, longitude}, callback) => {
    const url = 'https://api.darksky.net/forecast/3bee8a2665bc06ce180f3af4a95a28f3/' + latitute + ',' + longitude + '?units=auto'
    request({
            url,
            json: true
        }, (error, response, body) => {
            if(error)
            {
                callback('Couln\'t get the weather information of the place', undefined)
                return
            }
            else if(response.body.error){
                callback('Invalid location provided', undefined)
                return
            }
            
            const data = {
                summary: body.daily.data[0].summary,
                temperature: body.currently.temperature,
                precipProbability: body.currently.precipProbability
            }
            
            callback(undefined, data)
    })
}

module.exports = forecast