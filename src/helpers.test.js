const helpers = require('./helpers');

test('valid object of arrays is converted', () => {
    const data = [
        {
            input: {
                a: [1, 2, 3],
                b: [4, 5, 6],
            },
            output: [
                { a: 1, b: 4 },
                { a: 2, b: 5 },
                { a: 3, b: 6 },
            ],
        },
        {
            input: {
                a: [1],
                b: [2],
            },
            output: [{ a: 1, b: 2 }],
        },
    ];
    data.forEach(({ input, output }) => {
        expect(helpers.objectOfArraysToArrayOfObjects(input)).toEqual(output);
    });
});

test('invalid object of arrays throws error', () => {
    const data = [
        {
            a: [1, 2, 3],
            b: [1, 2],
        },
        {},
    ];
    data.forEach((input) => {
        expect(() => {
            helpers.objectOfArraysToArrayOfObjects(input);
        }).toThrow();
    });
});

test('location id is parsed properly', () => {
    const data = [
        {
            url:
                'https://weather.com/cs-CZ/weather/today/l/d59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c',
            locationId:
                'd59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c',
        },
        {
            url:
                'https://weather.com/cs-CZ/weather/monthly/l/d59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c#test',
            locationId:
                'd59971d16b1b808fd775cf6f51716cfffc26979b3935a567a92ce63ef3d4e41c',
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

test('parses data script', () => {
    const data = [
        { input: 'window.__data=JSON.parse("{}");', output: {} },
        { input: 'window.__data=JSON.parse("{}");window.experience={}', output: {} },
        { input: 'window.__data={};', output: {} },
        { input: 'window.__data={};window.experience={"connectionSpeed":"4g","deviceClass":"desktop"};', output: {} },
    ];
    data.forEach(({ input, output }) => {
        expect(helpers.parseWindowDataScript(input)).toEqual(output);
    });
});
