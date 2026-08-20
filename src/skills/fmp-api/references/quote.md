# FMP API Group: Quote

Source: https://site.financialmodelingprep.com/developer/docs#quote

Endpoints: 16

Conventions: `*` means required. Auth is omitted from examples; add `apikey` by query string or header.

## Endpoints

### Stock Quote API

Access real-time stock quotes with the FMP Stock Quote API. Get up-to-the-minute prices, changes, and volume data for individual stocks.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `price` | number |
| `changePercentage` | number |
| `change` | number |
| `volume` | integer |
| `dayLow` | number |
| `dayHigh` | number |
| `yearHigh` | number |
| `yearLow` | number |
| `marketCap` | integer |
| `priceAvg50` | number |
| `priceAvg200` | number |
| `exchange` | string |
| `open` | number |
| `previousClose` | number |
| `timestamp` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 232.8,
    "changePercentage": 2.1008,
    "change": 4.79,
    "volume": 44489128,
    "dayLow": 226.65,
    "dayHigh": 233.13,
    "yearHigh": 260.1,
    "yearLow": 164.08,
    "marketCap": 3500823120000,
    "priceAvg50": 240.2278,
    "priceAvg200": 219.98755,
    "exchange": "NASDAQ",
    "open": 227.2,
    "previousClose": 228.01,
    "timestamp": 1738702801
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/quote

### Stock Quote Short API

Get quick snapshots of real-time stock quotes with the FMP Stock Quote Short API. Access key stock data like current price, volume, and price changes for instant market insights.

**Endpoint**

`GET https://financialmodelingprep.com/stable/quote-short?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "price": 232.8,
    "change": 4.79,
    "volume": 44489128
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/quote-short

### Aftermarket Trade API

Track real-time trading activity occurring after regular market hours with the FMP Aftermarket Trade API. Access key details such as trade prices, sizes, and timestamps for trades executed during the post-market session.

**Endpoint**

`GET https://financialmodelingprep.com/stable/aftermarket-trade?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `tradeSize` | integer |
| `timestamp` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "price": 232.53,
    "tradeSize": 132,
    "timestamp": 1738715334311
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/aftermarket-trade

### Aftermarket Quote API

Access real-time aftermarket stock quotes with the FMP Aftermarket Quote API. Track bid and ask prices, volume, and other relevant data outside of regular trading hours.

**Endpoint**

`GET https://financialmodelingprep.com/stable/aftermarket-quote?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `bidSize` | integer |
| `bidPrice` | number |
| `askSize` | integer |
| `askPrice` | number |
| `volume` | integer |
| `timestamp` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "bidSize": 1,
    "bidPrice": 232.45,
    "askSize": 3,
    "askPrice": 232.64,
    "volume": 41647042,
    "timestamp": 1738715334311
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/aftermarket-quote

### Stock Price Change API

Track stock price fluctuations in real-time with the FMP Stock Price Change API. Monitor percentage and value changes over various time periods, including daily, weekly, monthly, and long-term.

**Endpoint**

`GET https://financialmodelingprep.com/stable/stock-price-change?symbol=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbol* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `1D` | number |
| `5D` | number |
| `1M` | number |
| `3M` | number |
| `6M` | number |
| `ytd` | number |
| `1Y` | number |
| `3Y` | number |
| `5Y` | number |
| `10Y` | number |
| `max` | number |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "1D": 2.1008,
    "5D": -2.45946,
    "1M": -4.33925,
    "3M": 4.86014,
    "6M": 5.88556,
    "ytd": -4.53147,
    "1Y": 24.04092,
    "3Y": 35.04264,
    "5Y": 192.05871,
    "10Y": 678.8558,
    "max": 181279.04168
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/quote-change

### Stock Batch Quote API

Retrieve multiple real-time stock quotes in a single request with the FMP Stock Batch Quote API. Access current prices, volume, and detailed data for multiple companies at once, making it easier to track large portfolios or monitor multiple stocks simultaneously.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-quote?symbols=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbols* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `name` | string |
| `price` | number |
| `changePercentage` | number |
| `change` | number |
| `volume` | integer |
| `dayLow` | number |
| `dayHigh` | number |
| `yearHigh` | number |
| `yearLow` | number |
| `marketCap` | integer |
| `priceAvg50` | number |
| `priceAvg200` | number |
| `exchange` | string |
| `open` | number |
| `previousClose` | number |
| `timestamp` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 232.8,
    "changePercentage": 2.1008,
    "change": 4.79,
    "volume": 44489128,
    "dayLow": 226.65,
    "dayHigh": 233.13,
    "yearHigh": 260.1,
    "yearLow": 164.08,
    "marketCap": 3500823120000,
    "priceAvg50": 240.2278,
    "priceAvg200": 219.98755,
    "exchange": "NASDAQ",
    "open": 227.2,
    "previousClose": 228.01,
    "timestamp": 1738702801
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/batch-quote

### Stock Batch Quote Short API

Access real-time, short-form quotes for multiple stocks with the FMP Stock Batch Quote Short API. Get a quick snapshot of key stock data such as current price, change, and volume for several companies in one streamlined request.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-quote-short?symbols=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbols* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "price": 232.8,
    "change": 4.79,
    "volume": 44489128
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/batch-quote-short

### Batch Aftermarket Trade API

Retrieve real-time aftermarket trading data for multiple stocks with the FMP Batch Aftermarket Trade API. Track post-market trade prices, volumes, and timestamps across several companies simultaneously.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-aftermarket-trade?symbols=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbols* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `tradeSize` | integer |
| `timestamp` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "price": 232.53,
    "tradeSize": 132,
    "timestamp": 1738715334311
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/batch-aftermarket-trade

### Batch Aftermarket Quote API

Retrieve real-time aftermarket quotes for multiple stocks with the FMP Batch Aftermarket Quote API. Access bid and ask prices, volume, and other relevant data for several companies during post-market trading.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-aftermarket-quote?symbols=AAPL`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| symbols* | string | AAPL |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `bidSize` | integer |
| `bidPrice` | number |
| `askSize` | integer |
| `askPrice` | number |
| `volume` | integer |
| `timestamp` | integer |

Sample:

```json
[
  {
    "symbol": "AAPL",
    "bidSize": 1,
    "bidPrice": 232.45,
    "askSize": 3,
    "askPrice": 232.64,
    "volume": 41647042,
    "timestamp": 1738715334311
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/batch-aftermarket-quote

### Exchange Stock Quotes API

Retrieve real-time stock quotes for all listed stocks on a specific exchange with the FMP Exchange Stock Quotes API. Track price changes and trading activity across the entire exchange.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-exchange-quote?exchange=NASDAQ`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| exchange* | string | NASDAQ |
| short | boolean | true |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | integer |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "AAACX",
    "price": 6.38,
    "change": 0,
    "volume": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/full-exchange-quotes

### Mutual Fund Price Quotes API

Access real-time quotes for mutual funds with the FMP Mutual Fund Price Quotes API. Track current prices, performance changes, and key data for various mutual funds.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-mutualfund-quotes`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| short | boolean | true |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "ARCFX",
    "price": 9.84,
    "change": 0.01,
    "volume": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/full-mutualfund-quotes

### ETF Price Quotes API

Get real-time price quotes for exchange-traded funds (ETFs) with the FMP ETF Price Quotes API. Track current prices, performance changes, and key data for a wide variety of ETFs.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-etf-quotes`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| short | boolean | true |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "GULF",
    "price": 16.335,
    "change": 0.13,
    "volume": 3032
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/full-etf-quotes

### Full Commodities Quotes API

Get up-to-the-minute quotes for commodities with the FMP Commodities Quotes API. Track the latest prices, changes, and volumes for a wide range of commodities, including oil, gold, and agricultural products.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-commodity-quotes`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| short | boolean | true |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "DCUSD",
    "price": 19.89,
    "change": 0.23,
    "volume": 442
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/full-commodities-quotes

### Full Cryptocurrency Quotes API

Access real-time cryptocurrency quotes with the FMP Full Cryptocurrency Quotes API. Track live prices, trading volumes, and price changes for a wide range of digital assets.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-crypto-quotes`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| short | boolean | true |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "00USD",
    "price": 0.03071157,
    "change": -0.0026034,
    "volume": 169600
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/full-cryptocurrency-quotes

### Full Forex Quote API

Retrieve real-time quotes for multiple forex currency pairs with the FMP Batch Forex Quote API. Get real-time price changes and updates for a variety of forex pairs in a single request.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-forex-quotes`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| short | boolean | true |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "AEDAUD",
    "price": 0.43575,
    "change": 0.0009547891,
    "volume": 344
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/full-forex-quotes

### Full Index Quotes API

Track real-time movements of major stock market indexes with the FMP Stock Market Index Quotes API. Access live quotes for global indexes and monitor changes in their performance.

**Endpoint**

`GET https://financialmodelingprep.com/stable/batch-index-quotes`

**Parameters**

| Query Parameter | Type | Example |
| --- | --- | --- |
| short | boolean | true |

**Response**

Format: JSON array<object>

Response fields visible in sample:

| Field | Type |
| --- | --- |
| `symbol` | string |
| `price` | number |
| `change` | number |
| `volume` | integer |

Sample:

```json
[
  {
    "symbol": "^DJBGIE",
    "price": 4277.52,
    "change": -15.7,
    "volume": 0
  }
]
```

Docs: https://site.financialmodelingprep.com/developer/docs/stable/full-index-quotes
