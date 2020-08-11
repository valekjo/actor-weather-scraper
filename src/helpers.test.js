const helpers = require('./helpers');

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
        expect(helpers.getPlaceIdFromUrl(url)).toBe(locationId);
    });
});

test('zip code equality', () => {
    const data = [
        [['12300', '123 00'], true],
        [['12300', '123 00:FR'], true],
        [['12300', '123 000'], false],
    ];
    data.forEach(([[a, b], result]) => {
        expect(helpers.zipCodeEquals(a, b)).toBe(result);
    });
});
