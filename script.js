function getCurrentPosition(fn) {
    let defaultPos = [50, 50]

    if (!navigator.geolocation) {
        alert("Браузер не поддерживает")
        fn(defaultPos)
        return
    }

    navigator.geolocation.getCurrentPosition(
        function (location) {
            fn([location.coords.latitude, location.coords.longitude])
        },
        function () {
            alert("Доступ к геопозиции запрещен")
            fn(defaultPos)
        }
    )
}

function getWeatherJsonFromCoordinates(lat, lon, fn) {
    fetch("http://localhost:666/cord?lat=" + lat + "&lon=" + lon)
        .then(res => res.json())
        .then(res => fn(res[0], res[1]))
        .catch(e => fn(null, false))
}

function getWeatherJsonFromName(name, fn) {
    fetch("http://localhost:666/city?name=" + name)
        .then(res => res.json())
        .then(res => fn(res[0], res[1]))
        .catch(e => fn(null, false))
}

function createList(info) {
    let t = document.querySelector('#createList').cloneNode(true)
    let list = t.content.querySelectorAll('span')
    // console.log(list)
    list[1].textContent = `${info["weather"][0]["main"]}`
    list[3].textContent = `${info["main"]["pressure"]}`
    list[5].textContent = `${info["visibility"]}`
    list[7].textContent = `${info["clouds"]["all"]}`
    list[9].textContent = `${info["main"]["humidity"]}`
    return document.importNode(t.content, true)
}

function weatherIconUrl(info) {
    return "https://openweathermap.org/img/w/" + info["weather"][0]["icon"] + ".png"
}

function updateCurrentLocation() {
    getCurrentPosition(function (loc) {
        getWeatherJsonFromCoordinates(loc[0], loc[1], function (info, status) {
            if (status) {
                let t = document.querySelector('#updateCurrentLocation').cloneNode(true)
                t.content.querySelector('h2').textContent = `${info['name']}`
                t.content.querySelector('img').setAttribute('src', `${weatherIconUrl(info)}`)
                t.content.querySelector('.left_right').textContent = `${info["main"]["temp"]}` + '°C'
                t.content.querySelector('.right').append(createList(info))
                document.getElementById("current_weather_info").innerHTML = ''
                document.getElementById("current_weather_info").append(document.importNode(t.content, true))

            }
            else {
                document.getElementById("current_weather_info").innerHTML = 'Ошибка'
            }

        })
    })
}

updateCurrentLocation()
document.querySelector(".update_button button").addEventListener("click",function () {
    document.getElementById("current_weather_info").innerHTML = "загрузка"
    updateCurrentLocation()
})

function createCityInList(info) {
    let t = document.querySelector('#createCityInList').cloneNode(true)
    t.content.querySelector('h3').textContent = ` ${info["name"]}`
    t.content.querySelector('.degree').textContent = `${info["main"]["temp"]}` + '°C'
    t.content.querySelector('img').setAttribute('src', `${weatherIconUrl(info)}`)
    t.content.querySelector('button').setAttribute('city-id', `${info["id"]}`)
    t.content.querySelector('li').append(createList(info))
    return document.importNode(t.content, true)
}

function createCityInListLoading(info) {
    let t = document.querySelector('#createCityInListLoading').cloneNode(true)
    t.content.querySelector('li').setAttribute('data-tmp',`${info["id"]}`)
    t.content.querySelector('h3').textContent = ` ${info["name"]}`
    t.content.querySelector('button').setAttribute('city-id', `${info["id"]}`)
    return document.importNode(t.content, true)
}
function deleteB() {
    let w = document.getElementsByClassName("delete-button");
    for (let i = 0; i < w.length; i++) {
        let wi = w.item(i)
        wi.addEventListener("click", function () {
            wi.parentElement.parentElement.parentElement.remove()
            fetch(`http://localhost:666/removeItem?id=${wi.getAttribute("city-id")}`)
            //localStorage.removeItem(wi.getAttribute("city-id"))
        })
    }
}

document.getElementById("new_city_form").onsubmit = function (e) {
    e.preventDefault()
    let cityInput = document.getElementById("new_city_form_input")
    let city = cityInput.value
    cityInput.value = ""

    if (city === "") {
        alert("Пустое поле ввода")
        return false
    }

    if (city.toLowerCase() === "чита" || city.toLowerCase() === "chita") {
        alert("Ошибка: слишком токсичный город")
        return false
    }

    let infoT = {
        name: city,
        id: Math.random()
    }

    document.getElementById("favorites_list").prepend(createCityInListLoading(infoT))

    getWeatherJsonFromName(city, function (info, status) {
        document.querySelectorAll('[data-tmp="'+infoT["id"]+'"]')[0].remove()
        fetch('http://localhost:666/getInfo')
            .then(res => res.json())
            .then(data => {
                console.log(data)
                if (status) {
                    if (info["cod"] !== 200) {
                        alert("Произошла ошибка "+info["message"])
                    }
                    else if (data[(info["id"])]) {
                        alert("Сорян город уже добавлен " + data[info["id"]])
                    }
                    else {
                        document.getElementById("favorites_list").prepend(createCityInList(info))
                        deleteB()
                        fetch(`http://localhost:666/setInfo?id=${info.id}&name=${info.name}`)
                    }
                }
                else {
                    alert("Произошла ошибка")
                }
            })
    })

    return false
}

fetch('http://localhost:666/getInfo') 
    .then(res => res.json())
    .then(data => {
        for (let i = 0; i < Object.keys(data).length; i++){
            let key = Object.keys(data)[i]
            let value = data[key]
            let info = {
                name: value,
                id: key
            }
        
            document.getElementById("favorites_list").prepend(createCityInListLoading(info))
        
            getWeatherJsonFromName(value, function (info, status) {
                document.querySelectorAll('[city-id="'+key+'"]')[0].parentElement.parentElement.parentElement.remove()
                if (status) {
                    if (info["cod"] !== 200) {
                        alert("Произошла ошибка "+info["message"])
                    }
                    else {
                        document.getElementById("favorites_list").prepend(createCityInList(info))
                        deleteB()
                        fetch(`http://localhost:666/setInfo?id=${info.id}&name=${info.name}`)
                    }
                }
                else {
                    alert("Произошла ошибка")
                }
            })
        }
    })
