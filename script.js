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
            alert("Что-то пошло не так")
            fn(defaultPos)
        }
    )
}

function getWeatherJsonFromCoordinates(lat, lon, fn) {
    fetch("https://api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+lon+"&units=metric&appid=9c267e6baa6acb2b0131fb15ee8200bb").then(
        t => {
            t.json().then(function(b) {
                try {
                    fn(b, true)
                }
                catch (e) {
                    fn(null, false)
                }
            })
        }
    )
}

function getWeatherJsonFromName(name, fn) {
    try {
        fetch("https://api.openweathermap.org/data/2.5/weather?q="+name+"&units=metric&appid=9c267e6baa6acb2b0131fb15ee8200bb").then(
            t => {
                t.json().then(function(b) {
                    try {
                        fn(b, true)
                    }
                    catch (e) {
                        fn(null, false)
                    }
                })
            }
        )
            .catch(t => fn(null, false))
    }
    catch (e) {
        fn(null, false)
    }

}

function createList(info) {
    return `
    <ul class="current_info">
        <li><span>Тип погоды</span> <span>`+info["weather"][0]["main"]+`</span></li>
        <li><span>Давление</span> <span>`+info["main"]["pressure"]+`</span></li>
        <li><span>Видимость</span> <span>`+info["visibility"]+`</span></li>
        <li><span>Облачность</span> <span>`+info["clouds"]["all"]+`</span></li>
        <li><span>Влажность</span> <span>`+info["main"]["humidity"]+`</span></li>
    </ul>
    `
}

function weatherIconUrl(info) {
    return "https://openweathermap.org/img/w/" + info["weather"][0]["icon"] + ".png"
}

function updateCurrentLocation() {
    getCurrentPosition(function (loc) {
        getWeatherJsonFromCoordinates(loc[0], loc[1], function (info, status) {
            document.getElementById("current_weather_info").innerHTML = `
        <div class="left">
            <h2>`+info['name']+`</h2>
            <div class="left_content">
                <div class="left_left">
                    <img src="`+weatherIconUrl(info)+`">
                </div>
                <div class="left_right">`+info["main"]["temp"]+`°C</div>
            </div>
        </div>
        <div class="right">
            `+createList(info)+`
        </div>
        `
        })
    })
}

updateCurrentLocation()
document.querySelector(".update_button button").addEventListener("click",function () {
    document.getElementById("current_weather_info").innerHTML = "загрузка"
    updateCurrentLocation()
})

function createCityInList(info) {
    return `
    <li>
        <div class="block_header">
            <h3>` + info["name"] + `</h3>
            <div class="degree">` + info["main"]["temp"] + `°C</div>
            <img src="` + weatherIconUrl(info) + `">
            <div>
                <button class="delete-button" city-id="`+info["id"]+`">x</button>
            </div>
        </div>
        ` + createList(info) + `
    </li>
    `
}

function createCityInListLoading(info) {
    return `
    <li>
        <div class="block_header" >
            <h3>` + info["name"] + `</h3>
            <div class="degree"></div>
            <div>
                <button class="delete-button" city-id="`+info["id"]+`">x</button>
            </div>
        </div>
        Загрузка
    </li>
    `
}

function deleteB() {
    let w = document.getElementsByClassName("delete-button");
    for (let i = 0; i < w.length; i++) {
        w.item(i).addEventListener("click", function () {
            w.item(i).parentElement.parentElement.parentElement.remove()
            localStorage.removeItem(w.item(i).getAttribute("city-id"))
        })
    }
}

document.getElementById("new_city_form").onsubmit = function () {
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

    getWeatherJsonFromName(city, function (info, status) {
        if (status) {
            if (info["cod"] !== 200) {
                alert("Произошла ошибка "+info["message"])
            }
            else if (localStorage.getItem(info["id"]) !== null) {
                alert("Сорян город уже добавлен "+localStorage.getItem(info["id"]))
            }
            else {
                document.getElementById("favorites_list").insertAdjacentHTML("afterbegin", createCityInList(info))
                deleteB()
                localStorage.setItem(info["id"], info["name"])
            }
        }
        else {
            alert("Произошла ошибка")
        }
    })

    return false
}

for (let i = 0; i < localStorage.length; i++){
    let key = localStorage.key(i)
    let value = localStorage.getItem(key)
    let info = {
        name: value,
        id: key
    }

    document.getElementById("favorites_list").insertAdjacentHTML("afterbegin", createCityInListLoading(info))

    getWeatherJsonFromName(value, function (info, status) {
        document.querySelectorAll('[city-id="'+key+'"]')[0].parentElement.parentElement.parentElement.remove()
        if (status) {
            if (info["cod"] !== 200) {
                alert("Произошла ошибка "+info["message"])
            }
            else {
                document.getElementById("favorites_list").insertAdjacentHTML("afterbegin", createCityInList(info))
                deleteB()
                localStorage.setItem(info["id"], info["name"])
            }
        }
        else {
            alert("Произошла ошибка")
        }
    })
}