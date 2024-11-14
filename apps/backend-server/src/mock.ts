// Function to generate random weather data

const CONDITIONS = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'];
const LOCATIONS = ['New York', 'London', 'Tokyo', 'Sydney'];
const getWeatherData = () => ({
  temperature: `${(Math.random() * 40).toFixed(1)} °C`,
  condition: CONDITIONS[Math.floor(Math.random() * 4)],
  location: LOCATIONS[Math.floor(Math.random() * 4)],
});

const STICKERS = ['AAPL', 'GOOG', 'AMZN', 'MSFT'];
// Function to generate random stock data
const getStockData = () => ({
  stock: STICKERS[Math.floor(Math.random() * 4)],
  price: (Math.random() * 1000 + 100).toFixed(2), // Price between 100 and 1100
  change: ((Math.random() - 0.5) * 10).toFixed(2), // Change between -5% and 5%
});

export { getWeatherData, getStockData };