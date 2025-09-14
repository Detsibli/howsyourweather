document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const cityInput = document.getElementById("locationInput");
  const unitSelect = document.getElementById("unitSelect");
  const speedUnitSelect = document.getElementById("speedUnitSelect");
  const progressBar = document.getElementById("searchProgress");

  const currentWindow = document.getElementById("currentWindow");
  const hourlyWindow = document.getElementById("hourlyWindow");
  const weeklyWindow = document.getElementById("weeklyWindow");

  const weatherHome = document.getElementById("weatherHome");
  const weatherForecast = document.getElementById("weatherForecast");
  const weatherMaps = document.getElementById("weatherMaps");

  const formatTime = timeStr =>
    new Date(timeStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Hide all weather windows initially
  [currentWindow, hourlyWindow, weeklyWindow].forEach(w => w.style.display = "none");

  // Disable browser autocomplete
  if (cityInput) cityInput.setAttribute("autocomplete", "off");

  // --- Autocomplete dropdown ---
  const dropdown = document.createElement("div");
  dropdown.className = "autocomplete-dropdown";
  cityInput.parentElement.appendChild(dropdown);

  cityInput.addEventListener("input", async () => {
    const query = cityInput.value.trim();
    if (!query) {
      dropdown.style.display = "none";
      return;
    }

    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        dropdown.style.display = "none";
        return;
      }

      dropdown.innerHTML = "";
      data.results.forEach(loc => {
        const item = document.createElement("div");
        item.textContent = `${loc.name}, ${loc.country}`;
        item.addEventListener("click", () => {
          cityInput.value = `${loc.name}, ${loc.country}`;
          dropdown.style.display = "none";
        });
        dropdown.appendChild(item);
      });

      dropdown.style.display = "block";
    } catch (err) {
      dropdown.style.display = "none";
      console.error("Autocomplete error:", err);
    }
  });

  document.addEventListener("click", e => {
    if (!cityInput.parentElement.contains(e.target)) dropdown.style.display = "none";
  });

  // --- Progress bar animation ---
  const animateProgress = async () => {
    if (!progressBar) return;
    progressBar.style.display = "block";
    progressBar.value = 0;
    for (let i = 0; i <= 90; i += Math.floor(Math.random() * 15) + 5) {
      progressBar.value = i;
      await new Promise(r => setTimeout(r, 100));
    }
  };

  const finishProgress = () => {
    if (!progressBar) return;
    progressBar.value = 100;
    setTimeout(() => { progressBar.style.display = "none"; progressBar.value = 0; }, 300);
  };

  const showError = (msg, container) => {
    container.innerHTML = `<p style="text-align:center;color:red;">${msg}</p>`;
  };

  // --- Fetch weather ---
  const fetchWeather = async () => {
    const city = cityInput?.value.trim();
    const unit = unitSelect?.value || "celsius";
    const speedUnit = speedUnitSelect?.value || "kmh";

    if (!city) return showError("❌ Please enter a city.", weatherHome);

    await animateProgress();

    try {
      // Geocoding
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) throw "Location not found.";
      const { latitude, longitude, name, country } = geoData.results[0];
      const locationLabel = `${name}, ${country}`;

      // Current weather
      const currData = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=precipitation&temperature_unit=${unit==="fahrenheit"?"fahrenheit":"celsius"}`)).json();
      const current = currData.current_weather;

      // Hourly
      const hourlyRaw = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,windspeed_10m,precipitation&temperature_unit=${unit==="fahrenheit"?"fahrenheit":"celsius"}`)).json();
      const hourly = hourlyRaw.hourly.time.slice(0,5).map((_,i)=>({
        time: hourlyRaw.hourly.time[i],
        temperature: hourlyRaw.hourly.temperature_2m[i],
        windspeed: hourlyRaw.hourly.windspeed_10m[i],
        precipitation: hourlyRaw.hourly.precipitation[i]
      }));

      // Weekly
      const dailyRaw = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum&temperature_unit=${unit==="fahrenheit"?"fahrenheit":"celsius"}`)).json();
      const daily = dailyRaw.daily.time.slice(0,7).map((date,i)=>({
        date,
        max: dailyRaw.daily.temperature_2m_max[i],
        min: dailyRaw.daily.temperature_2m_min[i],
        sunrise: dailyRaw.daily.sunrise[i],
        sunset: dailyRaw.daily.sunset[i],
        precipitation: dailyRaw.daily.precipitation_sum[i]
      }));

      renderWeather(current, hourly, daily, unit, speedUnit, locationLabel);
      [currentWindow, hourlyWindow, weeklyWindow].forEach(w => w.style.display = "flex");

      finishProgress();
    } catch(err) {
      console.error(err);
      showError("⚠️ Something went wrong. Please try again.", weatherHome);
      finishProgress();
    }
  };

  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    fetchWeather();
  });

  function renderWeather(current, hourly, daily, unit, speedUnit, locationLabel){
    const speedLabel = speedUnit==="mph"?"m/h":"km/h";
    const currentSpeed = speedUnit==="mph"? (current.windspeed*0.621371).toFixed(1) : current.windspeed;

    // Update window titles
    currentWindow.querySelector(".title-bar-text").textContent = `Current Weather — ${locationLabel}`;
    hourlyWindow.querySelector(".title-bar-text").textContent = `Hourly Forecast — ${locationLabel}`;
    weeklyWindow.querySelector(".title-bar-text").textContent = `Weekly Forecast — ${locationLabel}`;

    // Current
    weatherHome.innerHTML = `
      <div class="weather-card">
        <p>🌡️ Temp: <strong>${current.temperature}° ${unit==="celsius"?"C":"F"}</strong></p>
        <p>💨 Wind: ${currentSpeed} ${speedLabel}</p>
        <p>🌧️ Precipitation: ${current.precipitation ?? "0"} mm</p>
        <p>💦 Rain Chance: ${Math.min((current.precipitation ?? 0) * 10, 100)}%</p>
      </div>
    `;

    // Hourly
    weatherForecast.innerHTML = hourly.map(w=>{
      const hSpeed = speedUnit==="mph"? (w.windspeed*0.621371).toFixed(1): w.windspeed;
      return `
        <div class="weather-card">
          <p>${formatTime(w.time)}</p>
          <p>🌡️ ${w.temperature}°</p>
          <p>💨 ${hSpeed} ${speedLabel}</p>
          <p>🌧️ ${w.precipitation} mm</p>
          <p>💦 Rain Chance: ${Math.min(w.precipitation*10,100)}%</p>
        </div>`;
    }).join('');

    // Weekly
    weatherMaps.innerHTML = daily.map(w=>{
      return `
        <div class="weather-card">
          <p>${new Date(w.date).toDateString()}</p>
          <p>🌡️ Max: ${w.max}° / Min: ${w.min}°</p>
          <p>☀️ Sunrise: ${formatTime(w.sunrise)}</p>
          <p>🌇 Sunset: ${formatTime(w.sunset)}</p>
          <p>🌧️ Total Precipitation: ${w.precipitation} mm</p>
        </div>`;
    }).join('');
  }

});