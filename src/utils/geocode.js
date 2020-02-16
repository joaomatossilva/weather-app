const request = require('request')

const geocode = (address, callback) => {
    const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(address) + '.json?limit=1&access_token=pk.eyJ1Ijoia2FwcHkzMDAwIiwiYSI6ImNrNm80eTJrdzBjMGwzbG05eDgzcG50bTYifQ.yS8bOK3N9kN-bhhHJmc1eg'
    request({ url, json: true}, (error, response, body) => {
        if(error)
        {
            callback('Couln\'t get the coordinates of the address', undefined)
            return
        } else if(body.features.length === 0){
            callback('Invalid address. Not found', undefined)
            return
        }

        const coordinates = {
            latitute: body.features[0].center[1],
            longitude: body.features[0].center[0],
            name: body.features[0].place_name
        }
        
        callback(undefined, coordinates)
    })
}

module.exports = geocode