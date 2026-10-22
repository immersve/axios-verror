# Axios Verror

Enhance [Axios] request errors using [VError].


## Installation

```bash
npm install @centrapay/axios-verror
```


## Usage

Handle axios errors with `AxiosVError.enhance`:

```javascript
axios.request(args).catch(AxiosVError.enhance);
```

Error will be rethrown as a VError with a better error message and
with `VError.info()` populated with structured details about the
error.


## Complete Example

```javascript
const AxiosVError = require('@centrapay/axios-verror');
const axios = require('axios');

async function callApi(data) {
  await axios.request({
    url: 'http://myhost/',
    method: 'POST',
    data,
  }).catch(AxiosVError.enhance);
}
```

## Handling Enhanced Errors

```javascript
try {
  await callApi({ msg: 'hello' });
}
catch (e) {
  if (VError.info(e).axios?.status == 421) {
    // handle rate limit
  }
}
```

## VError Info

Structured details about the error can be extracted with
`VError.info(err).axios`. An object with the following properties will be
provided:

| Name    | Type                 | Description                                                                  |
| -       | -                    | -                                                                            |
| method  | String               | HTTP request method (GET, POST etc).                                         |
| url     | String               | HTTP request URL. Query params not included when defined as Axios "params".  |
| status  | Number *(Optional)* | HTTP response status code.                                                   |
| message | String *(Optional)* | Extracted HTTP response message. See `extractMessage()` option to customize. |
| code    | String *(Optional)* | Error code from axios or underlying system (e.g., ECONNRESET, ERR_BAD_REQUEST). |
| res     | Object *(Optional)* | Raw Axios response object. See [Axios Response Schema].

Only the requested method and URL are guaranteed to be present. Other
properties require a response. Whether a response is available depends on
the underlying error. For example, if there is a network connectivity issue
then there will not be an HTTP response available.


## Error Messages

Axios error messages normally only provide an HTTP status code. This,
presumably, prevents Axios leaking potentially sensitive details into logs,
such as host names or path parameters, but it makes debugging errors difficult.
Example Axios error message:

```
Request failed with status code 400
```

Enhanced error messages include status, method, URL and a formatted
message extracted from the response. Example enhanced message:

```
[400] POST https://host/ (invalid request): Request failed with status code 400
```

## Customizing

Create a modified instance of AxiosVError with `AxiosVError.configure()`:

```javascript
const axiosVError = AxiosVError.configure({
  extractMessage: res => res?.data?.error_code
});
axios.request(args).catch(axiosVError.enhance);
```

AxiosVError instances can be reused.


### Options

The following options are available for configuring AxiosVError behavior.

#### extractMessage(res)

A function which extracts the error message from the axios response. By
default, the message will be attempted to be taken from the parsed Axios
response body as either `res.data.message` or `res.data.error.message`.

#### formatSummary(ctx)

A function which generates the formatted error message from the
[error context](#error-context). By default, the message will be formatted
like:

```javascript
`[${status}] ${method} ${url} (${message})`
```

### Error Context

`formatSummary()` receives an object with the following properties:

| Name    | Type                 | Description                                                         |
| -       | -                    | -                                                                   |
| err     | Object               | Original Axios error.                                               |
| config  | Object               | Axios request config, including any custom properties.              |
| res     | Object *(Optional)* | Raw Axios response object.                                          |
| method  | String               | HTTP request method (GET, POST etc).                                |
| url     | String               | HTTP request URL, as in `VError.info(err).axios`.                   |
| status  | Number *(Optional)* | HTTP response status code.                                          |
| code    | String *(Optional)* | Error code from axios or underlying system (e.g., ECONNRESET).     |
| message | String *(Optional)* | Message returned by `extractMessage()`.                             |


## History

See [Changelog](./CHANGELOG.md)

## Legal

Copyright © 2022 [Centrapay][].

This software is licensed under Apache-2.0 License. Please see [LICENSE](/LICENSE) for details.


[Centrapay]: https://centrapay.com/
[Axios]: https://axios-http.com/
[VError]: https://github.com/joyent/node-verror
[Axios Response Schema]: https://axios-http.com/docs/res_schema
