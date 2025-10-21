const imperialBtn = document.getElementById("imperial-dropdown");
const imperialMenu = document.getElementById("imperial-menu");
const imperialIcon = document.querySelector("#imperial-dropdown .dropdown-icon");
const daysDropdownBtn = document.getElementById("days-dropdown");
const weeksDropdown = document.querySelector(".weeks-dropdown");
const daysIcon = document.querySelector("#days-dropdown .dropdown-icon");

imperialBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = imperialMenu.style.display === "block";
  imperialMenu.style.display = isOpen ? "none" : "block";
  imperialIcon.classList.toggle("rotate", !isOpen);
});

daysDropdownBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = weeksDropdown.style.display === "block";
  weeksDropdown.style.display = isOpen ? "none" : "block";
  daysIcon.classList.toggle("rotate", !isOpen);
});

window.addEventListener("click", (e) => {
  if (!imperialMenu.contains(e.target) && e.target !== imperialBtn) {
    imperialMenu.style.display = "none";
    imperialIcon.classList.remove("rotate");
  }
  if (!weeksDropdown.contains(e.target) && e.target !== daysDropdownBtn) {
    weeksDropdown.style.display = "none";
    daysIcon.classList.remove("rotate");
  }
});

document.querySelectorAll(".imperial-menu, .weeks-dropdown").forEach((menu) => {
  menu.style.transition = "opacity 0.3s ease";
  menu.style.opacity = 0;
  const observer = new MutationObserver(() => {
    menu.style.opacity = menu.style.display !== "none" ? 1 : 0;
  });

  observer.observe(menu, { attributes: true, attributeFilter: ["style"] });
});

document.addEventListener("DOMContentLoaded", function () {

  const cityInput = document.querySelector(".cityInput");
  const searchBTN = document.querySelector(".searchBTN");
  const cityDisplay = document.getElementById("location");
  const todaysDate = document.getElementById("todaysDate");
  const weatherIcon = document.getElementById("Todays-weather-icon");
  const DegreeDisplay = document.querySelector(".todaysDegree");
  const weatherDescription = document.getElementById("feels");
  const humidityDisplay = document.getElementById("Humidity-value");
  const windDisplay = document.getElementById("Wind-value");
  const precipitationDisplay = document.getElementById("Precipitation-value");
  const errorDisplay = document.getElementById("errorMessage");
  const mainContent = document.getElementById("mainContent");
  const retryBTN = document.getElementById("retryBTN");
  const forecastCard = document.getElementById("forecast-card");
  const hourlyForecast = document.getElementById("hour-tempDisplay");

 
  const daysBtns = {
    tue: document.getElementById("tue-hourForcast"),
    wed: document.getElementById("wed-hourForcast"),
    thur: document.getElementById("thur-hourForcast"),
    fri: document.getElementById("Fri-hourForcast"),
    sat: document.getElementById("sat-hourForcast"),
    sun: document.getElementById("sun-hourForcast"),
    mon: document.getElementById("mon-hourForcast"),
  };

  
  const loader = document.createElement("div");
  loader.id = "loadingOverlay";
  loader.style.display = "none";
  loader.innerHTML = `
    <div class="loader-container">
      <div class="spinner"></div>
    </div>`;
  document.body.appendChild(loader);
  const loadingOverlay = document.getElementById("loadingOverlay");

  
  let tempUnit = "celsius"; 
  let windUnit = "kmh";    
  let precipUnit = "mm";    
  let currentLocation = { latitude: 6.5244, longitude: 3.3792, name: "Lagos" };
  let hourlyDataCache = null; 
  let dailyDates = []; 


  async function showLoading(show) {
    loadingOverlay.style.display = show ? "flex" : "none";
  }

  function getWeatherDetails(code) {
    const map = {
      0: { description: "Clear sky", icon: "./assets/images/icon-sunny.webp" },
      1: { description: "Mainly clear", icon: "./assets/images/icon-sunny.webp" },
      2: { description: "Partly cloudy", icon: "./assets/images/icon-partly-cloudy.webp" },
      3: { description: "Overcast", icon: "./assets/images/icon-partly-cloudy.webp" },
      45: { description: "Fog", icon: "./assets/images/icon-fog.webp" },
      48: { description: "Depositing rime fog", icon: "./assets/images/icon-fog.webp" },
      51: { description: "Light drizzle", icon: "./assets/images/icon-rain.webp" },
      61: { description: "Rain", icon: "./assets/images/icon-rain.webp" },
      71: { description: "Snow fall", icon: "./assets/images/icon-snow.webp" },
      95: { description: "Thunderstorm", icon: "./assets/images/icon-storm.webp" },
    };
    return map[code] || { description: "Unknown", icon: "./assets/images/icon-unknown.webp" };
  }
 
  function extractCurrent(data) {
    if (data.current_weather) {
      return {
        temperature_2m: data.current_weather.temperature,
        relative_humidity_2m: data.hourly && data.hourly.relative_humidity_2m ? data.hourly.relative_humidity_2m[0] : undefined,
        wind_speed_10m: data.current_weather.windspeed,
        precipitation: (data.hourly && data.hourly.precipitation) ? data.hourly.precipitation[0] : undefined,
        weather_code: data.current_weather.weathercode,
      };
    } else if (data.current) {
      return data.current;
    } else {
      return {};
    }
  }

  async function getCoordinates(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const resp = await fetch(geoUrl);
    if (!resp.ok) throw new Error("Geocoding failed");
    const j = await resp.json();
    if (!j.results || j.results.length === 0) throw new Error("City not found");
    return j.results[0];
  }

  async function fetchWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto` +
      `&current_weather=true` +
      `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Weather data fetch failed");
    return await resp.json();
  }

  async function getDailyForecast(lat, lon) {
    const data = await fetchWeatherData(lat, lon); 
    if (data.daily && data.daily.time) {
      dailyDates = data.daily.time.slice(); 
    } else {
      dailyDates = [];
    }

   
    forecastCard.innerHTML = "";
    const days = data.daily?.time || [];
    const maxTemps = data.daily?.temperature_2m_max || [];
    const minTemps = data.daily?.temperature_2m_min || [];
    const weatherCodes = data.daily?.weather_code || [];

    for (let i = 0; i < days.length; i++) {
      const dayName = new Date(days[i]).toLocaleDateString("en-US", { weekday: "short" });
      const weatherInfo = getWeatherDetails(weatherCodes[i]);
      const item = document.createElement("div");
      item.classList.add("display-forecast");
      item.innerHTML = `
        <p class="days">${dayName}</p>
        <img src="${weatherInfo.icon}" alt="${weatherInfo.description}" class="forecast-icon" />
        <div class="temp-digit">
          <p class="forecast-degree">${Math.round(maxTemps[i] ?? 0)}° / ${Math.round(minTemps[i] ?? 0)}°</p>
        </div>
      `;
      forecastCard.appendChild(item);
    }

    return data; 
  }

  async function fetchHourlyData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto` +
      `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Hourly fetch failed");
    const data = await resp.json();
    hourlyDataCache = data.hourly || null;
    if (data.daily && data.daily.time) dailyDates = data.daily.time.slice();
    displayHourlyForecastByDateIndex(0);
  }


  function loadLocationData(city, data) {
    const current = extractCurrent(data);
    cityDisplay.textContent = city || (data?.timezone ?? currentLocation.name);
    const currentDate = new Date();
    todaysDate.textContent = currentDate.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", weekday: "long"
    });

    const weatherInfo = getWeatherDetails(current.weather_code);
    weatherIcon.src = weatherInfo.icon;
    weatherDescription.textContent = weatherInfo.description || "";
    if (current.temperature_2m !== undefined) {
      DegreeDisplay.textContent = `${Math.round(current.temperature_2m)}°${tempUnit === "fahrenheit" ? "F" : "C"}`;
    }
    if (current.relative_humidity_2m !== undefined) humidityDisplay.textContent = `${current.relative_humidity_2m}%`;
    if (current.wind_speed_10m !== undefined) windDisplay.textContent = `${current.wind_speed_10m} ${windUnit === "mph" ? "mph" : "km/h"}`;
    if (current.precipitation !== undefined) precipitationDisplay.textContent = `${current.precipitation} ${precipUnit}`;
  }

  function displayHourlyForecastByDateIndex(dayIndex) {
    if (!hourlyDataCache || !hourlyDataCache.time) {
      hourlyForecast.innerHTML = `<p class="no-data">No hourly data available</p>`;
      return;
    }
    hourlyForecast.innerHTML = "";

    
    const targetDay = dailyDates[dayIndex];
    if (!targetDay) {
      hourlyForecast.innerHTML = `<p class="no-data">Day not available</p>`;
      return;
    }

    for (let i = 0; i < hourlyDataCache.time.length; i++) {
      const dt = hourlyDataCache.time[i]; 
      if (!dt.startsWith(targetDay)) continue; 

      const hourLabel = new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
      const temp = Math.round(hourlyDataCache.temperature_2m?.[i] ?? NaN);
      const code = hourlyDataCache.weather_code?.[i];
      const weatherInfo = getWeatherDetails(code);

      const div = document.createElement("div");
      div.className = "hour-temp-display";
      div.innerHTML = `
        <div class="time-img">
          <img src="${weatherInfo.icon}" alt="${weatherInfo.description}" class="forecast-icon"/>
          <p class="time">${hourLabel}</p>
        </div>
        <p class="temp">${isNaN(temp) ? "--" : temp + "°"}</p>
      `;
      hourlyForecast.appendChild(div);
    }
  }

  
  function $(selector) { return document.querySelector(selector); }
  function findCheckmark(selectors) {
    for (const s of selectors) {
      const el = $(s);
      if (el) return el;
    }
    return null;
  }


  const CheckMarkCelsius = findCheckmark([".CheckMark-Celsius", ".checkMark-Celsius", ".checkmark-celsius", "#CheckMarkCelsius"]);
  const CheckMarkFahrenheit = findCheckmark([".CheckMark-Fahrenheit", ".checkMark-Fahrenheit", ".checkmark-fahrenheit", "#CheckMarkFahrenheit"]);
  const CheckMarkKm = findCheckmark([".CheckMark-Km", ".checkMark-Km", ".checkmark-km", "#CheckMarkKm"]);
  const CheckMarkMph = findCheckmark([".CheckMark-Mph", ".checkMark-Mph", ".checkmark-mph", ".checkMark-MPH", "#CheckMarkMph"]);
  const CheckMarkMm = findCheckmark([".CheckMark-Mm", ".checkMark-Mm", ".checkmark-mm", "#CheckMarkMm"]);
  const CheckMarkIn = findCheckmark([".CheckMark-In", ".checkMark-In", ".checkmark-in", ".checkMark-Inch", "#CheckMarkIn"]);

 
  const celsiusBtn = document.getElementById("Celsius-btn");
  const fahrenheitBtn = document.getElementById("Fahrenheit-btn");
  const kmBtn = document.getElementById("Km-btn");
  const mphBtn = document.getElementById("mph-btn");
  const mmBtn = document.getElementById("mm-btn");
  const inBtn = document.getElementById("in-btn");

  
  function toggleCheck(checkEl, visible) {
    if (!checkEl) return;
    checkEl.style.visibility = visible ? "visible" : "hidden";
  }

  
  if (celsiusBtn) celsiusBtn.addEventListener("click", async () => {
    tempUnit = "celsius";
    toggleCheck(CheckMarkCelsius, true);
    toggleCheck(CheckMarkFahrenheit, false);
    await refreshWeather();
  });

  if (fahrenheitBtn) fahrenheitBtn.addEventListener("click", async () => {
    tempUnit = "fahrenheit";
    toggleCheck(CheckMarkFahrenheit, true);
    toggleCheck(CheckMarkCelsius, false);
    await refreshWeather();
  });

  if (kmBtn) kmBtn.addEventListener("click", async () => {
    windUnit = "kmh";
    toggleCheck(CheckMarkKm, true);
    toggleCheck(CheckMarkMph, false);
    await refreshWeather();
  });

  if (mphBtn) mphBtn.addEventListener("click", async () => {
    windUnit = "mph";
    toggleCheck(CheckMarkMph, true);
    toggleCheck(CheckMarkKm, false);
    await refreshWeather();
  });

  if (mmBtn) mmBtn.addEventListener("click", async () => {
    precipUnit = "mm";
    toggleCheck(CheckMarkMm, true);
    toggleCheck(CheckMarkIn, false);
    await refreshWeather();
  });

  if (inBtn) inBtn.addEventListener("click", async () => {
    precipUnit = "inch";
    toggleCheck(CheckMarkIn, true);
    toggleCheck(CheckMarkMm, false);
    await refreshWeather();
  });

  
  async function refreshWeather() {
    if (!currentLocation) return;
    showLoading(true);
    try {
      const data = await fetchWeatherData(currentLocation.latitude, currentLocation.longitude);
      loadLocationData(currentLocation.name || cityInput.value || `${currentLocation.latitude},${currentLocation.longitude}`, data);
      
      await getDailyForecast(currentLocation.latitude, currentLocation.longitude);
      await fetchHourlyData(currentLocation.latitude, currentLocation.longitude);
    } catch (err) {
      console.error("refreshWeather error:", err);
      errorDisplay.style.display = "block";
    } finally {
      showLoading(false);
    }
  }

 
  searchBTN.addEventListener("click", async (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (!city) return;
    try {
      showLoading(true);
      const location = await getCoordinates(city);
      currentLocation = location;
      
      const data = await fetchWeatherData(location.latitude, location.longitude);
      loadLocationData(city, data);
      await getDailyForecast(location.latitude, location.longitude);
      await fetchHourlyData(location.latitude, location.longitude);
      errorDisplay.style.display = "none";
      mainContent.style.visibility = "visible";
    } catch (error) {
      console.error("Error fetching weather data:", error);
      errorDisplay.style.display = "block";
      mainContent.style.visibility = "hidden";
    } finally {
      showLoading(false);
    }
  });

  retryBTN.addEventListener("click", async () => {
    await refreshWeather();
  });

  
  const dayOrder = ["tue", "wed", "thur", "fri", "sat", "sun", "mon"];
  dayOrder.forEach((dayKey, idx) => {
    const el = daysBtns[dayKey];
    if (!el) return;
    el.addEventListener("click", () => {
      let chosenIndex = idx;
      if (dailyDates.length > idx) {
        chosenIndex = idx;
      } else chosenIndex = 0;
      displayHourlyForecastByDateIndex(chosenIndex);
      location.hash = `#${dayKey}`;
    });
  });

  function defaultDisplay() {
    errorDisplay.style.display = "none";
    mainContent.style.visibility = "visible";
    cityDisplay.textContent = "London, GB";
    const currentDate = new Date();
    todaysDate.textContent = currentDate.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", weekday: "long"
    });
    weatherIcon.src = "./assets/images/icon-sunny.webp";
    DegreeDisplay.textContent = "25°";
    weatherDescription.textContent = "Sunny";
    humidityDisplay.textContent = "50%";
    windDisplay.textContent = "10 km/h";
    precipitationDisplay.textContent = "0 mm";
    forecastCard.innerHTML = ""; hourlyForecast.innerHTML = "";
  }

  defaultDisplay();

  (async () => {
    try {
      await refreshWeather();
    } catch (e) { }
  })();
});
