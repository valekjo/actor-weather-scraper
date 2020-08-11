# My beautiful actor

The `README.md` file contains a documentation what your actor does and how to use it,
which is then displayed in the app or Apify Store. It's always a good
idea to write a good `README.md`, in a few months not even you
will remember all the details about the actor.

You can use [Markdown](https://www.markdownguide.org/cheat-sheet)
language for rich formatting.

## Documentation reference

- [Apify SDK](https://sdk.apify.com/)
- [Apify Actor documentation](https://docs.apify.com/actor)
- [Apify CLI](https://docs.apify.com/cli)


## Dev Notes

All places available on weather.com are identified by placeId.

Url for respective weather pages is then `https://weather.com/${locale}/weather/{today|hourbyhour|tenday|weekend|monthly}/l/${placeId}`


 - Location might be used instead of trying to set measurement units in cookies:

   - `en-US`, `en-UK` for `F`, `C` respectively


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
