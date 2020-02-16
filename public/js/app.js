
const weatherForm = document.querySelector('form')
const locationInput = document.querySelector('input')
const messageOne = document.querySelector('#message-one')
const messageTwo = document.querySelector('#message-two')

weatherForm.addEventListener('submit', (e) => {
    e.preventDefault()

    messageOne.textContent = 'Loading...'
    messageTwo.textContent = ''

    fetch('/weather?address=' + encodeURIComponent(locationInput.value))
    .then((response) => {
        response.json().then((data) => {
            if(data.error) {
                messageOne.textContent = data.error
                messageTwo.textContent = ''
                return
            }

            messageOne.textContent = data.location
            messageTwo.textContent = "Now it\'s " + data.forecastPrediction.temperature + "º and it\'s " + data.forecastPrediction.summary
            console.log(data)
        })
    })
})