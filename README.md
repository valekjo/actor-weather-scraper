### Weather Scraper

Weather Scraper is an [Apify actor](https://apify.com/actors) for extracting weather information from [Weather.com](https://weather.com). It gives you access to various available weather data in structured form. It is build on top of [Apify SDK](https://sdk.apify.com/) and you can run it both on [Apify platform](https://my.apify.com) and locally.

- [Input](#input)
- [Output](#output)
- [Compute units consumption](#compute-units-consumption)
- [Extend output function](#extend-output-function)

### Input

| Field | Type | Description | Default value
| ----- | ---- | ----------- | -------------|
| startUrls | array | List of place urls to be processed |
| cities | array |
| zipCodes | array |
| units | string |
| timeFrame | string |
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
        title: $('.fxqkUh p').eq(0).text(),
        url-title: undefined,
        modified: $('.stats time').eq(0).text(),
    }
}
```
This example will add a new field `modified`, change the `title` field and remove `url-title` field
```
{
    "title": "lukaskrivka/apify-store-scraper"
    "sourceUrl": "https://github.com/metalwarrior665/apify-store-scraper",
    "usedTimes": 50000,
    "description": "Scrape all information about actors in Apify Store!",
    "modified: "3 months ago"
}
```

### Epilogue
Thank you for trying my actor. I will be very glad for a feedback that you can send to my email `lukas@apify.com`. If you find any bug, please create an issue on the [Github page](https://github.com/metalwarrior665/actor-public-actor-input-example/issues).

----------------------------------------------------------------------------------------



## Dev Notes

All places available on weather.com are identified by placeId.

Url for respective weather pages is then `https://weather.com/${locale}/weather/{today|hourbyhour|tenday|weekend|monthly}/l/${placeId}`


 - Location might be used instead of trying to set measurement units in cookies:

   - `en-US`, `en-CA` for `F`, `C` respectively


 - finding location ids for address / zip / etc can be done using:

```
 curl 'https://weather.com/api/v1/p/redux-dal' \
>   -H 'content-type: application/json' \
>   --data-binary '[{"name":"getSunV3LocationSearchUrlConfig","params":{"query":"11000","language":"cs-CZ","locationType":"locale"}}]' \
>   --compressed
```

Algorithm:

1. Get all relevant placeIds by:
  - parsing them from startUrls
  - search for them by query (city, zip)

2. Construct urls for combination of placeId, time frame and units



### Problems

Switching between metric and imperial units happens through cookies - but the desired result can be achieved by accessing page with specific locale (but how about cookies? are the same cookies used all the time in the crawler?) - does not matter - whole crawl uses the same minutes.

Zip code, state, etc. are not present in the page code. However, they can be obtained through page search (which is already used to search for places by name.) so we can use the same to obtain more details.

Monthly a weekday pages have different structures than the rest.


### TODO

 1. input validation
 2. error handling
 3. specific page handlers
 4. tests
 5. output cleanup
 6. readme, license, etc
