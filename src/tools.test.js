const tools = require('./tools');

test('location id is parsed properly', () => {
    const data = [
        {
            url: 'https://weather.com/cs-CZ/weather/today/l/d59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c',
            locationId: 'd59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c',
        },
        {
            url: 'https://weather.com/cs-CZ/weather/monthly/l/d59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c',
            locationId: 'd59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c',
        },
        {
            url: 'https://weather.com/cs-CZ/weather/monthly/l/d59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c#test',
            locationId: 'd59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c',
        },
    ];
    data.forEach(({ url, locationId }) => {
        expect(tools.getPlaceIdFromUrl(url)).toBe(locationId);
    });
});
