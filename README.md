### Weather Scraper

Weather Scraper is an [Apify actor](https://apify.com/actors) for extracting weather information from [Weather.com](https://weather.com). It gives you access to various available weather data in structured form. It is build on top of [Apify SDK](https://sdk.apify.com/) and you can run it both on [Apify platform](https://my.apify.com) and locally.

- [Input](#input)
- [Output](#output)
- [Compute units consumption](#compute-units-consumption)
- [Extend output function](#extend-output-function)

### Input

| Field | Type | Description | Default value
| ----- | ---- | ----------- | -------------|
| startUrls | array | List of place urls to be processed | `[]` |
| cities | array | List of cities / addresses to be processed | `[]` |
| zipCodes | array | List of zip codes to be processed | `[]` |
| units | string | Unit system to use for the results | `metric` |
| timeFrame | string | Future time frame you want to extract data for | `today` |
| maxItems | number | Maximum number of actor pages that will be scraped | all found |
| extendOutputFunction | string | Function that takes a JQuery handle ($) as argument and returns data that will be merged with the default output. More information in [Extend output function](#extend-output-function) | |
| proxyConfiguration | object | Proxy settings of the run. If you have access to Apify proxy, leave the default settings. If not, you can set `{ "useApifyProxy": false" }` to disable proxy usage | `{ "useApifyProxy": true }`|

### Output

Output is stored in a dataset. Each item is information about weather in a location. The items come in two forms - day/night values for daily items and current values for moment items. Example for day/night values:

```
{
  "city": "Třeboň",
  "state": "South Bohemia",
  "country": "Czech Republic",
  "zipCode": "379 01",
  "time": "2020-08-15T07:00:00+0200",
  "temperature": "24/16",
  "forecast": "Thunderstorms/Scattered Thunderstorms",
  "humidity": "79/88",
  "windDirection": "W/WNW",
  "windSpeed": "9/6"
}
```

Example for current values:
```
{
  "city": "Třeboň",
  "state": "South Bohemia",
  "country": "Czech Republic",
  "zipCode": "379 01",
  "time": "2020-08-12T19:00:00+0200",
  "temperature": 27,
  "forecast": "Sunny",
  "humidity": 45,
  "windDirection": "E",
  "windSpeed": 7
}
```


### Compute units consumption
Keep in mind that it is much more efficient to run one longer scrape (at least one minute) than more shorter ones because of the startup time.

The average consumption is **1 Compute unit for 1000 actor pages** scraped

### Extend output function

You can use this function to update the default output of this actor. This function gets a JQuery handle `$` as an argument so you can choose what data from the page you want to scrape. The output from this will function will get merged with the default output.

The return value of this function has to be an object!

You can return fields to achive 3 different things:
- Add a new field - Return object with a field that is not in the default output
- Change a field - Return an existing field with a new value
- Remove a field - Return an existing field with a value `undefined`


```
($) => {
    return {
        title: $('title').text(),
        humidity: undefined,
        temperature: 451,
    }
}
```
This example will add a new field `title`, change the `temperature` field and remove `humidity` field
```
{
  "title": "Třeboň, South Bohemia, Czech Republic 10-Day Weather Forecast - The Weather Channel | Weather.com"
  "city": "Třeboň",
  "state": "South Bohemia",
  "country": "Czech Republic",
  "zipCode": "379 01",
  "time": "2020-08-12T19:00:00+0200",
  "temperature": 451,
  "forecast": "Sunny",
  "windDirection": "E",
  "windSpeed": 7
}
```

Note that all the data are scraped from ten day page (eg. `https://weather.com/weather/tenday/l/81cbe8a06fd80171651aef7a414bce1e599aa05082d82f4e319f94b4b60602e0`).

### Epilogue
Thank you for trying my actor. I will be very glad for a feedback that you can send to my email `josef@apify.com`. If you find any bug, please create an issue on the [Github page](https://github.com/valekjo/actor-weather-scraper/issues).

### TODO

 4. tests
 6. readme, license, etc
 7. legal ?
