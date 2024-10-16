const apikey = "25b867c436580460135dbf82395c0973";

var city;
let barChartInstance = null; // Variable to store the chart instance
let bardelayed; // Declare bardelayed variable
let isDarkMode = false;
let lineChart = null; // Variable to store the chart instance
let delayed; // Declare delayed variable
let currentPage = 1; // Track the current page
let totalPages = 0; // Total number of pages
let forecastData = [];
let filteredData = []; // Filtered data for the table

const rowsPerPage = 10; // Number of rows to display per page
const allCelsiusColumns = [
  "Date", "Temperature (°C)", "Feels Like (°C)", "Min Temp (°C)", "Max Temp (°C)", 
  "Pressure (hPa)", "Humidity (%)", "Weather Condition", "Wind Speed (m/s)", 
  "Wind Direction (°)", "Visibility (km)", "Cloudiness (%)"
];

const allFahrenheitColumns = [
  "Date", "Temperature (°F)", "Feels Like (°F)", "Min Temp (°F)", "Max Temp (°F)", 
  "Pressure (hPa)", "Humidity (%)", "Weather Condition", "Wind Speed (m/s)", 
  "Wind Direction (°)", "Visibility (km)", "Cloudiness (%)"
];

const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-btn");
const loader = document.getElementById("loader");
const widgetdata = document.getElementById("widget-data");
const toggleButton = document.getElementById("toggle-theme");
const ctx = document.getElementById("vertical-bar-chart").getContext("2d");

var doughnutChart = null; // Variable to store the chart instance
var isCelsius = true; // Variable to store the temperature unit

document.getElementById('unit-toggle-input').addEventListener('change', function() {
   isCelsius = !this.checked; // true if toggle is off (Celsius), false if on (Fahrenheit)
 console.log(isCelsius);
 if (city) {
  getCurrentWeatherByCity(city); // Call the function to get weather data
  get5DayForecastByCity(city); // Call the function to get 5-day forecast
  cityInput.value = ""; // Clear the city input field
}else{
  getUserLocation();
}
});
// Function to convert Kelvin to Celsius
function kelvinToCelsius(kelvin) {
  return Math.round(kelvin - 273.15);
}

function kelvinToFahrenheit(kelvin) {
  return Math.round((kelvin - 273.15) * 9/5 + 32);
}

// Function to fetch current weather data using coordinates (latitude & longitude)
async function getCurrentWeatherByCoords(lat, lon) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apikey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    hideWeatherWidget(); // Hide the weather widget
    showLoader();

    if (response.ok) {
      console.log("Current Weather by coordinates:", data);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Add a 2-second delay
      displayWeatherData(data); // Call the function to display the data
    } else {
      console.error("Error fetching weather data:", data.message);
      alert("City not found. Please try again."); // Alert for invalid city
    }
  } catch (error) {
    console.error("Error fetching current weather data:", error);
  } finally {
    hideLoader(); // Hide the loading indicator
    showWeatherWidget();
  }
}

//get5DayForecastByCity("London");
//get5DayForecastByCoords(51.5074, 0.1278);

// Function to get the current weather by city name
async function getCurrentWeatherByCity(city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}`; // Added units=metric for Celsius

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    hideWeatherWidget(); // Hide the weather widget
    showLoader();

    if (response.ok) {
      console.log("Current Weather:", data);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Add a 2-second delay
      displayWeatherData(data); // Call the function to display the data
    } else {
      console.error("Error fetching weather data:", data.message);
      alert("City not found. Please try again."); // Alert for invalid city
    }
  } catch (error) {
    console.error("Error fetching current weather data:", error);
  } finally {
    hideLoader(); // Hide the loading indicator
    showWeatherWidget();
  }
}


// Function to display the weather data in the widget
function displayWeatherData(data) {
  // Update widget elements with the received data
  document.getElementById(
    "city-name"
  ).innerText = `${data.name}, ${data.sys.country}`;
  document.getElementById("date-time").innerText = new Date(
    data.dt * 1000
  ).toLocaleString(); // Convert timestamp to local date and time

  // Convert temperature using the appropriate conversion function
  const temp = isCelsius ? kelvinToCelsius(data.main.temp) : kelvinToFahrenheit(data.main.temp);
  const tempUnit = isCelsius ? "°C" : "°F";
  document.getElementById("temperature").innerText = `${temp}${tempUnit}`; // Display temperature in the selected unit

  // Update feels-like temperature
  const feelsLike = isCelsius ? kelvinToCelsius(data.main.feels_like) : kelvinToFahrenheit(data.main.feels_like);
  document.getElementById(
    "feels-like"
  ).innerText = `Feels like ${feelsLike}${tempUnit}. ${data.weather[0].description}.`;

  // Update the weather icon using the icon code from the API
  const iconCode = data.weather[0].icon; // Get the icon code
  document.getElementById(
    "weather-icon"
  ).src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`; // Set the icon URL

  document.getElementById("wind-speed").innerText = `${
    data.wind.speed
  } m/s ${getWindDirection(data.wind.deg)}`;
  document.getElementById("humidity").innerText = `${data.main.humidity}%`;
  document.getElementById("pressure").innerText = `${data.main.pressure} hPa`;
  document.getElementById("visibility").innerText = `${(
    data.visibility / 1000
  ).toFixed(1)} km`; // Convert visibility to km
  document.getElementById("dew-point").innerText = `${calculateDewPoint(
    temp,
    data.main.humidity
  ).toFixed(2)}${tempUnit}`;

  // Show the weather widget
  document.getElementById("weather-widget").style.display = "block";
}

// Helper function to get wind direction
function getWindDirection(deg) {
  if (deg >= 0 && deg < 23) return "N";
  if (deg >= 23 && deg < 68) return "NE";
  if (deg >= 68 && deg < 113) return "E";
  if (deg >= 113 && deg < 158) return "SE";
  if (deg >= 158 && deg < 203) return "S";
  if (deg >= 203 && deg < 248) return "SW";
  if (deg >= 248 && deg < 293) return "W";
  if (deg >= 293 && deg < 338) return "NW";
  return "N"; // Default for degrees >= 338
}

// Helper function to calculate dew point
function calculateDewPoint(temp, humidity) {
  return temp - (100 - humidity) / 5; // Simple approximation formula
}


// Add event listener for the 'click' event on the search button
searchButton.addEventListener("click", function () {
   city = cityInput.value.trim(); // Get the city name
  if (city) {
    getCurrentWeatherByCity(city); // Call the function to get weather data
    get5DayForecastByCity(city); // Call the function to get 5-day forecast
    cityInput.value = ""; // Clear the city input field
  }
});

// Add event listener for the 'keydown' event on the input field
cityInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    searchButton.click(); // Trigger the button click event
  }
});

// Function to show the loader
function showLoader() {
  loader.style.display = "block"; // Show the loader
}

// Function to hide the loader
function hideLoader() {
  loader.style.display = "none"; // Hide the loader
}

// Function to show the weather widget
function showWeatherWidget() {
  widgetdata.style.display = "block"; // Show the weather widget
}

// Function to hide the weather widget
function hideWeatherWidget() {
  widgetdata.style.display = "none"; // Hide the weather widget
}

// Function to get the user's location
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Fetch and display weather data using the coordinates
        getCurrentWeatherByCoords(lat, lon);
        get5DayForecastByCoords(lat, lon);
      },
      (error) => {
        console.error("Error getting location:", error);
        // Display a dialog box instead of alert
        const dialogBox = document.createElement('div');
        dialogBox.style.position = 'fixed';
        dialogBox.style.top = '50%';
        dialogBox.style.left = '50%';
        dialogBox.style.transform = 'translate(-50%, -50%)';
        dialogBox.style.padding = '20px';
        dialogBox.style.backgroundColor = '#fff';
        dialogBox.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
        dialogBox.style.zIndex = '1000';
        dialogBox.innerHTML = `
           
          <p>Unable to retrieve your location. Fetching weather data for London.</p>
           <button id="dialog-ok-btn" style="display: block; margin: 0 auto;">OK</button>

        `;

        // Create an overlay to blur the background
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999';

        document.body.appendChild(overlay);
        document.body.appendChild(dialogBox);

        document.getElementById('dialog-ok-btn').addEventListener('click', () => {
          document.body.removeChild(dialogBox);
          document.body.removeChild(overlay);
        });

        document.body.appendChild(dialogBox);

        document.getElementById('dialog-ok-btn').addEventListener('click', () => {
          document.body.removeChild(dialogBox);
        });
        // Fetch and display weather data for London
        getCurrentWeatherByCoords(51.5074, -0.1278);
        get5DayForecastByCoords(51.5074, -0.1278);
      }
    );
  } else {
    alert("Geolocation is not supported by this browser. Fetching weather data for London.");
    // Fetch and display weather data for London
    getCurrentWeatherByCoords(51.5074, -0.1278);
    get5DayForecastByCoords(51.5074, -0.1278);
  }
}

// Call the function to get user's location on page load
window.onload = getUserLocation;

async function get5DayForecastByCity(city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apikey}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("5-Day Forecast:", data);

    const temperatures = [];
    const labels = [];
    const weatherConditions = []; // To store weather conditions

    for (let dayIndex = 0; dayIndex < data.list.length; dayIndex += 8) {
      let totalTemperature = 0;

      // Loop through the 8 entries for the day
      for (let i = 0; i < 8; i++) {
        const temp = data.list[dayIndex + i].main.temp; // Get temperature
        totalTemperature += temp; // Sum up the temperature
        const condition = data.list[dayIndex + i].weather[0].description; // Get weather condition
        weatherConditions.push(condition); // Add to the weather conditions array
      }

      // Calculate average for the day
      const averageTemperature = totalTemperature / 8;

      // Get the date for the first entry of the day
      const date = new Date(data.list[dayIndex].dt * 1000).toLocaleDateString();

      // Store the average temperature and the date
      temperatures.push(averageTemperature);
      labels.push(date);
    }

    createBarChart(temperatures, labels); // Call function to create bar chart
    createDoughnutChart(weatherConditions);
    createLineChart(temperatures, labels);
    forecastData = data.list; // Store the forecast data globally
    filteredData = [...forecastData];
    // Calculate the total number of pages
    totalPages = Math.ceil(forecastData.length / rowsPerPage);
    fillTable(); // Fill the table with forecast data
    return data;
  } catch (error) {
    console.error("Error fetching 5-day forecast:", error);
  }
}

// Function to fetch 5-day weather forecast using coordinates (latitude & longitude)
async function get5DayForecastByCoords(lat, lon) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apikey}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("5-Day Forecast:", data);

    const temperatures = [];
    const labels = [];
    const weatherConditions = []; // To store weather conditions
    for (let dayIndex = 0; dayIndex < data.list.length; dayIndex += 8) {
      let totalTemperature = 0;

      // Loop through the 8 entries for the day
      for (let i = 0; i < 8; i++) {
        const temp = data.list[dayIndex + i].main.temp; // Get temperature
        totalTemperature += temp; // Sum up the temperature
        // Store the weather condition for the day
        const condition = data.list[dayIndex + i].weather[0].description; // Get weather condition
        weatherConditions.push(condition); // Add to the weather conditions array
      }

      // Calculate average for the day
      const averageTemperature = totalTemperature / 8;

      // Get the date for the first entry of the day
      const date = new Date(data.list[dayIndex].dt * 1000).toLocaleDateString();

      // Store the average temperature and the date
      temperatures.push(averageTemperature);
      labels.push(date);
    }

    createBarChart(temperatures, labels); // Call function to create bar chart
    createDoughnutChart(weatherConditions);
    createLineChart(temperatures, labels);
    forecastData = data.list; // Store the forecast data globally
    filteredData = [...forecastData];
    // Calculate the total number of pages
    totalPages = Math.ceil(forecastData.length / rowsPerPage);
    fillTable(); // Fill the table with forecast data
    return data;
  } catch (error) {
    console.error("Error fetching 5-day forecast:", error);
  }
}


function createBarChart(temperatures, labels) {
  const ctx = document.getElementById("vertical-bar-chart").getContext("2d");

  // Check if a chart instance already exists and destroy it
  if (barChartInstance !== null) {
    barChartInstance.destroy();
  }

  // Convert temperatures to the selected unit
const convertedTemperatures = [];
for (let i = 0; i < temperatures.length; i++) {
  const temp = temperatures[i];
  const convertedTemp = isCelsius ? Math.round(temp - 273.15) : Math.round((temp - 273.15) * 9/5 + 32);
  convertedTemperatures.push(convertedTemp);
}
  const tempUnit = isCelsius ? "°C" : "°F";

  barChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels, // Days
      datasets: [
        {
          label: `Temperature (${tempUnit})`,
          data: convertedTemperatures, // Array of temperatures for the next 5 days
          backgroundColor: "#ffd700", // dark yellow
          borderColor: "#ddd", // Colored border
          borderWidth: 1, // Set the border width
          barThickness: 15, // Set the bar thickness for a narrow appearance
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allow the aspect ratio to be adjusted
      scales: {
        x: {
          title: {
            display: true,
            text: "Days",
            color: "#ddd", // Dark text
          },
          ticks: {
            color: "#ddd", // Dark text
            font: {
              size: 10, // Set font size for x-axis ticks
            },
          },
        },
        y: {
          title: {
            display: true,
            text: `Temperature (${tempUnit})`,
            color: "#ddd", // Dark text
          },
          beginAtZero: true,
          ticks: {
            color: "#ddd", // Dark text
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#ddd", // Dark text
          },
        },
      },
      animation: {
        onComplete: () => {
          bardelayed = true; // Mark animation as complete
        },
        delay: (context) => {
          let delay = 0;
          if (
            context.type === "data" &&
            context.mode === "default" &&
            !bardelayed
          ) {
            // Apply delay for each bar
            delay = context.dataIndex * 300 + context.datasetIndex * 100;
          }
          return delay;
        },
      },
    },
  });
}


toggleButton.addEventListener("click", () => {
  // Toggle the dark mode class on the body
  document.body.classList.toggle("dark-mode");

  // Toggle the isDarkMode variable
  isDarkMode = !isDarkMode; // Change to true if it's false, and vice versa
});



function createDoughnutChart(weatherConditions) {
  const ctx = document.getElementById("doughnut-chart").getContext("2d");

  // Check if a chart instance already exists and destroy it
  if (doughnutChart !== null) {
    doughnutChart.destroy();
  }

  // Count occurrences of each weather condition
  const conditionCounts = weatherConditions.reduce((acc, condition) => {
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(conditionCounts); // Weather condition labels
  const data = Object.values(conditionCounts); // Array of counts of weather conditions

  // Define text color based on your project's theme
  const textColor = "#ddd"; // Adjust this if you have dynamic theme switching

  // Create the doughnut chart
  doughnutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels, // Weather condition labels
      datasets: [
        {
          label: "Weather Conditions",
          data: data, // Array of counts of weather conditions
          backgroundColor: [
            "#9dbcc8",
            "#8FE0FF",
            "#78c7e5",
            "#ffce56",
            "#66ff66",
          ], // Colors for each slice
          hoverOffset: 4, // Hover effect
        },
      ],
    },
    options: {
      responsive: true,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 20,
          bottom: 20,
        },
      },
      plugins: {
        datalabels: {
          anchor: "end", // Ensures labels stay inside
          align: "end", // Aligns labels properly
          clamp: true, // Ensures labels don’t overflow
          rotation: 45, // Rotate labels if needed
          color: textColor, // Set label text color
        },
        legend: {
          display: true,
          position: "top",
          labels: {
            color: textColor, // Set legend text color
          },
        },
        tooltip: {
          backgroundColor: "#333", // Dark tooltip background
          titleColor: "#fff", // Tooltip title color
          bodyColor: textColor, // Tooltip text color based on theme
          callbacks: {
            label: (tooltipItem) => {
              const total = data.reduce((a, b) => a + b, 0);
              const percentage = ((tooltipItem.raw / total) * 100).toFixed(2);
              return `${tooltipItem.label}: ${percentage}%`; // Display percentage of each weather condition
            },
          },
        },
      },
      animation: {
        duration: 1500, // Total animation duration (in ms)
        onComplete: () => {
          delayed = true; // Mark animation as complete
        },
        delay: (context) => {
          let delay = 0;
          if (
            context.type === "data" &&
            context.mode === "default" &&
            !delayed
          ) {
            // Stagger the animation based on the index of the doughnut slices
            delay = context.dataIndex * 500; // Add delay for each segment
          }
          return delay;
        },
        easing: "easeInOutBounce", // Animation easing effect
      },
    },
  });
}

function createLineChart(temperatures, labels) {
  const ctx = document.getElementById("line-chart").getContext("2d");

  // Check if a chart instance already exists and destroy it
  if (lineChart !== null) {
    lineChart.destroy();
  }

  // Convert temperatures to the selected unit
  const convertedTemperatures = [];
  for (let i = 0; i < temperatures.length; i++) {
    const temp = temperatures[i];
    const convertedTemp = isCelsius ? Math.round(temp - 273.15) : Math.round((temp - 273.15) * 9/5 + 32);
    convertedTemperatures.push(convertedTemp);
  }
  const tempUnit = isCelsius ? "°C" : "°F";

  // Define text color based on your project's theme
  const textColor = "#ddd"; // Adjust this if you have dynamic theme switching

  // Create the line chart
  lineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels, // Dates for the x-axis
      datasets: [
        {
          label: `Temperature (${tempUnit})`, // Y-axis label
          data: convertedTemperatures, // Array of average temperatures for each day
          borderColor: "#ffd700", // Line color
          backgroundColor: "#ffd90035", // Area under the line color
          fill: true, // Fill the area under the line
          tension: 0.3, // Smoothness of the line
          pointBackgroundColor: "#ffcb6b", // Point color
          pointBorderColor: "#ffd700", // Point border color
          pointRadius: 5, // Radius of points on the line
          pointHoverRadius: 7, // Radius of points on hover
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: textColor, // Set legend text color
          },
        },
        tooltip: {
          backgroundColor: "#333", // Dark tooltip background
          titleColor: "#fff", // Tooltip title color
          bodyColor: textColor, // Tooltip text color based on theme
        },
      },
      animation: {
        // Enable drop animation
        y: {
          type: "number",
          duration: 1000, // Duration of the animation (in ms)
          easing: "easeOutBounce", // Easing function for the animation
          from: (context) => {
            // Animate from a higher value (for drop effect)
            if (context.active) {
              return context.chart.scales.y.max + 10; // Start above the maximum y value
            }
            return null; // Don't animate if not active
          },
        },
        x: {
          duration: 1000, // Duration for the x-axis animation (in ms)
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor, // Set x-axis ticks color
          },
          title: {
            display: true,
            text: "Date", // X-axis label
            color: textColor,
          },
        },
        y: {
          ticks: {
            color: textColor, // Set y-axis ticks color
          },
          title: {
            display: true,
            text: `Temperature (${tempUnit})`, // Y-axis label
            color: textColor,
          },
        },
      },
    },
  });
}


// Function to dynamically fill the table with forecast data
function fillTable() {
  const headerRow = document.getElementById('table-headers');
  headerRow.innerHTML = ''; // Clear previous headers

  // Determine which columns to use based on the temperature unit
  const allColumns = isCelsius ? allCelsiusColumns : allFahrenheitColumns;

  // Insert table headers
  allColumns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column;
      headerRow.appendChild(th);
  });

  const tbody = document.getElementById('forecast-tbody');
  tbody.innerHTML = ''; // Clear previous rows

  // Calculate the index range for the current page
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  // Slice the forecast data for the current page
  const currentData = filteredData.slice(start, end);

  // Loop through the sliced forecast entries
  currentData.forEach(entry => {
      const row = document.createElement('tr');

      // Data to display in the row
      const rowData = [
          entry.dt_txt,                        // Date and Time
          isCelsius ? kelvinToCelsius(entry.main.temp) : kelvinToFahrenheit(entry.main.temp), // Temperature
          isCelsius ? kelvinToCelsius(entry.main.feels_like) : kelvinToFahrenheit(entry.main.feels_like), // Feels like temperature
          isCelsius ? kelvinToCelsius(entry.main.temp_min) : kelvinToFahrenheit(entry.main.temp_min), // Min temperature
          isCelsius ? kelvinToCelsius(entry.main.temp_max) : kelvinToFahrenheit(entry.main.temp_max), // Max temperature
          entry.main.pressure,                 // Pressure
          entry.main.humidity,                 // Humidity
          entry.weather[0].description,        // Weather condition (description)
          entry.wind.speed,                    // Wind speed
          entry.wind.deg,                      // Wind direction
          entry.visibility,                    // Visibility
          entry.clouds.all                     // Cloudiness (%)
      ];

      // Create table cells for each piece of data
      rowData.forEach(data => {
          const td = document.createElement('td');
          td.textContent = data;
          row.appendChild(td);
      });

      // Append the row to the table body
      tbody.appendChild(row);
  });

  // Update page information
  document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;

  // Enable/Disable pagination buttons based on the current page
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = currentPage === totalPages;
}

// Pagination button event listeners
document.getElementById('prev-page').addEventListener('click', () => {
  if (currentPage > 1) {
      currentPage--;
      fillTable(); // Refill table with data for the new page
  }
});

document.getElementById('next-page').addEventListener('click', () => {
  if (currentPage < totalPages) {
      currentPage++;
      fillTable(); // Refill table with data for the new page
  }
});

// Event listener for filter dropdown
document.getElementById('filter-select').addEventListener('change', (e) => {
  const filterValue = e.target.value;
  applyFilter(filterValue); // Apply the selected filter
});
// Function to apply filters
function applyFilter(filter) {
  switch (filter) {
    case "asc":
      filteredData = [...forecastData].sort((a, b) => a.main.temp - b.main.temp);
      break;
    case "desc":
      filteredData = [...forecastData].sort((a, b) => b.main.temp - a.main.temp);
      break;
    case "rain":
      filteredData = forecastData.filter(entry => entry.weather[0].description.toLowerCase().includes("rain"));
      break;
    case "highest":
      const highestTempEntry = forecastData.reduce((prev, current) => 
        (prev.main.temp > current.main.temp) ? prev : current
      );
      filteredData = [highestTempEntry]; // Show only the highest temperature entry
      break;
    case "reset":
      filteredData = [...forecastData]; // Reset to original data
      break;
    default:
      filteredData = [...forecastData]; // No filter
  }

  currentPage = 1; // Reset to first page
  totalPages = Math.ceil(filteredData.length / rowsPerPage); // Recalculate total pages
  fillTable(); // Refill table with the filtered data
}

//chatbot integration
const defaultCity = cityInput.value.trim() || 'London';
const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
let userMessage = null;
let isResponseGenerating = false;

const API_KEY = "AIzaSyA3WKYFSixfc2EBlva8rCmJiv_hQMFn03g"; // Your API key here
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`; // Using template literal

// Temperature data for your table (replace with real table data)
const temperatureData = {
  Islamabad: [22, 25, 28, 21, 24], // example data for Islamabad
  Karachi: [30, 32, 31, 29, 33],   // example data for Karachi
};

// Load chat history from localStorage
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  chatContainer.innerHTML = savedChats || '';
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom on load
}

// Create chat message element
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

// Display API response by typing each word one by one (typing effect)
const showTypingEffect = (text, textElement) => {
  const words = text.split(' ');
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
    
    // Once all words are typed out
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false; 
      localStorage.setItem("saved-chats", chatContainer.innerHTML); // Save chat history
    }

    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  }, 75);
}

// Function to calculate highest, lowest, and average temperatures
const getTemperatureStats = (city) => {
  const temps = temperatureData[city];
  if (!temps) return null;
  
  const highest = Math.max(...temps);
  const lowest = Math.min(...temps);
  const average = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
  return { highest, lowest, average };
}

// Generate the API response based on the question asked
const generateAPIResponse = async (incomingMessageDiv, city) => {
  const textElement = incomingMessageDiv.querySelector(".text");

  // Check if the question is related to temperature
  if (userMessage.toLowerCase().includes("temperature")) {
    const stats = getTemperatureStats(city);
    if (stats) {
      const response = `In ${city}, the highest temperature was ${stats.highest}°C, the lowest was ${stats.lowest}°C, and the average temperature was ${stats.average}°C.`;
      showTypingEffect(response, textElement); // Show typing effect for the response
      return;
    } else {
      showTypingEffect(`Sorry, no temperature data available for ${city}.`, textElement);
      return;
    }
  }

  try {
    // Send request to the Generative API for other queries
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userMessage }] }]
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Get and display the response
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\\(.?)\\*/g, '$1');
    showTypingEffect(apiResponse, textElement); // Show typing effect for API response

  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    incomingMessageDiv.classList.add("error"); // Add error class for styling
  }
}



// Handle outgoing chat (user message)
const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;

  isResponseGenerating = true;

  const html = `<div class="message-content">
                  <img class="avatar" src="resources/images/ai-icon.png" alt="User Avatar">
                  <p class="text"></p>
                </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatContainer.appendChild(outgoingMessageDiv);

  typingForm.reset(); // Clear input field
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  
  // Handle API response display
  const incomingHtml = `<div class="message-content">
                          <img class="avatar" src="resources/images/ai-icon.png" alt="Gemini avatar">
                          <p class="text"></p>
                        </div>`;

  const incomingMessageDiv = createMessageElement(incomingHtml, "incoming");
  chatContainer.appendChild(incomingMessageDiv);

  generateAPIResponse(incomingMessageDiv, defaultCity); // Send request to API and display response
}

// Handle sending message when a suggestion is clicked
suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

// Prevent form submission default behavior
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});

// Get the modal and user profile icon
const modal = document.getElementById('developerDetailsModal');
const userProfile = document.getElementById('userProfile');
const closeBtn = document.querySelector('.close');

// Show modal when the user icon is clicked
userProfile.addEventListener('click', () => {
  modal.style.display = 'block';
});

// Close modal when the close button is clicked
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Close modal when the user clicks outside the modal
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// script.js

document.addEventListener("DOMContentLoaded", function() {
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const closeSidebar = document.getElementById("closeSidebar");

  toggleSidebar.addEventListener("click", function() {
      sidebar.classList.add("active"); // Show the sidebar
      toggleSidebar.style.display = "none"; // Hide the toggle button
  });

  closeSidebar.addEventListener("click", function() {
      sidebar.classList.remove("active"); // Hide the sidebar
      toggleSidebar.style.display = "block"; // Show the toggle button
  });
});
