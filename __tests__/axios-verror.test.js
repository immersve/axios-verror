/*
 * Copyright 2022 Centrapay
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const AxiosVError = require('../axios-verror');
const nock = require('nock');
const axios = require('axios');
const VError = require('verror');

describe('enhance', () => {

  test('basic', async () => {
    nock('http://nock')
      .post('/')
      .reply(400, { message: 'invalid request' });
    let caught = null;
    try {
      await axios.request({
        url: 'http://nock/',
        method: 'POST',
        data: { param: 'foo' },
      }).catch(AxiosVError.enhance);
    } catch (e) {
      caught = e;
    }
    expect(caught.message).toEqual(
      '[400] POST http://nock/ (invalid request): Request failed with status code 400'
    );
    expect(VError.info(caught)).toEqual({
      axios: expect.objectContaining({
        res: caught.jse_cause.response,
        message: 'invalid request',
        method: 'POST',
        status: 400,
        url: 'http://nock/',
      })
    });
  });

  test('query params', async () => {
    nock('http://nock')
      .get('/')
      .query({ foo: 1 })
      .reply(400, { message: 'invalid request' });
    let caught = null;
    try {
      await axios.request({
        url: 'http://nock/',
        method: 'GET',
        params: { foo: 1 },
      }).catch(AxiosVError.enhance);
    } catch (e) {
      caught = e;
    }
    expect(caught.message).toEqual(
      '[400] GET http://nock/ (invalid request): Request failed with status code 400'
    );
    expect(VError.info(caught)).toEqual({
      axios: expect.objectContaining({
        res: caught.jse_cause.response,
        message: 'invalid request',
        method: 'GET',
        status: 400,
        url: 'http://nock/',
      })
    });
  });

  test('only base url', async () => {
    nock('http://nock')
      .get('/')
      .reply(400, { message: 'invalid request' });
    let caught = null;
    const client = axios.create({
      baseURL: 'http://nock',
    });
    try {
      await client.request({
        method: 'GET',
      }).catch(AxiosVError.enhance);
    } catch (e) {
      caught = e;
    }
    expect(caught.message).toEqual(
      '[400] GET http://nock/ (invalid request): Request failed with status code 400'
    );
    expect(VError.info(caught)).toEqual({
      axios: expect.objectContaining({
        res: caught.jse_cause.response,
        message: 'invalid request',
        method: 'GET',
        status: 400,
        url: 'http://nock/',
      })
    });
  });

  test('base url and path', async () => {
    nock('http://nock')
      .get('/foo')
      .reply(400, { message: 'invalid request' });
    let caught = null;
    const client = axios.create({
      baseURL: 'http://nock',
    });
    try {
      await client.request({
        url: 'foo',
        method: 'GET',
      }).catch(AxiosVError.enhance);
    } catch (e) {
      caught = e;
    }
    expect(caught.message).toEqual(
      '[400] GET http://nock/foo (invalid request): Request failed with status code 400'
    );
    expect(VError.info(caught)).toEqual({
      axios: expect.objectContaining({
        res: caught.jse_cause.response,
        message: 'invalid request',
        method: 'GET',
        status: 400,
        url: 'http://nock/foo',
      })
    });
  });

  test('serialize verror', async () => {
    nock('http://nock')
      .get('/foo')
      .reply(400, { message: 'invalid request' });
    let caught = null;
    const client = axios.create({
      baseURL: 'http://nock',
    });
    try {
      await client.request({
        url: 'foo',
        method: 'GET',
      }).catch(AxiosVError.enhance);
    } catch (e) {
      caught = e;
    }
    expect(JSON.stringify(VError.info(caught))).toEqual(
      JSON.stringify({
        axios: {
          method: 'GET',
          url: 'http://nock/foo',
          status: 400,
          message: 'invalid request',
          code: 'ERR_BAD_REQUEST',
        }
      })
    );
  });

});

describe('configure', () => {

  test('formatSummary receives the full error context', async () => {
    nock('http://nock')
      .get('/users/42')
      .reply(404, { message: 'not found' });
    const axiosVError = AxiosVError.configure({
      formatSummary: (ctx) => [
        ctx.err.name,
        ctx.code,
        ctx.res.status,
        ctx.method,
        ctx.config.urlTemplate,
      ].join(' '),
    });
    const caught = await axios.request({
      url: 'http://nock/users/42',
      urlTemplate: 'users/{userId}',
      method: 'GET',
    }).catch(axiosVError.enhance).catch(e => e);
    expect(caught.message).toEqual(
      'AxiosError ERR_BAD_REQUEST 404 GET users/{userId}: Request failed with status code 404'
    );
  });

  test('formatSummary can reuse default formatting with request config', async () => {
    nock('http://nock')
      .get('/users/42')
      .reply(404, { message: 'not found' });
    const client = axios.create({
      baseURL: 'http://nock',
    });
    const axiosVError = AxiosVError.configure({
      formatSummary: (ctx) => {
        const templateConfig = Object.assign({}, ctx.config, { url: ctx.config.urlTemplate });
        return AxiosVError.formatSummary(Object.assign({}, ctx, {
          url: AxiosVError.formatUrl(templateConfig),
        }));
      },
    });
    const caught = await client.request({
      url: 'users/42',
      urlTemplate: 'users/{userId}',
      method: 'GET',
    }).catch(axiosVError.enhance).catch(e => e);
    expect(caught.message).toEqual(
      '[404] GET http://nock/users/{userId} (not found): Request failed with status code 404'
    );
    expect(VError.info(caught).axios.url).toEqual('http://nock/users/42');
  });

  test('extractInfo adds fields from request config and response', async () => {
    nock('http://nock')
      .get('/')
      .reply(400, { message: 'invalid request', responseCode: 'E42' });
    const axiosVError = AxiosVError.configure({
      extractInfo: (ctx) => ({
        axios: {
          requestId: ctx.config.headers['X-Request-ID'],
          responseCode: ctx.res.data.responseCode,
        },
      }),
    });
    const caught = await axios.request({
      url: 'http://nock/',
      method: 'GET',
      headers: { 'X-Request-ID': 'req-1' },
    }).catch(axiosVError.enhance).catch(e => e);
    expect(VError.info(caught).axios).toMatchObject({
      requestId: 'req-1',
      responseCode: 'E42',
      message: 'invalid request',
      status: 400,
    });
  });

  test('extractInfo adds top-level info for errors without a response', async () => {
    nock('http://nock')
      .get('/')
      .replyWithError(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }));
    const axiosVError = AxiosVError.configure({
      extractInfo: (ctx) => ({
        retryable: ctx.status === undefined && ctx.code === 'ECONNRESET',
      }),
    });
    const caught = await axios.request({
      url: 'http://nock/',
      method: 'GET',
    }).catch(axiosVError.enhance).catch(e => e);
    expect(VError.info(caught)).toMatchObject({
      retryable: true,
      axios: {
        code: 'ECONNRESET',
        method: 'GET',
        url: 'http://nock/',
      },
    });
  });

  test('built-in axios fields take precedence over extractInfo fields', async () => {
    nock('http://nock')
      .get('/')
      .reply(400, { message: 'invalid request' });
    const axiosVError = AxiosVError.configure({
      extractInfo: () => ({
        axios: { status: 200, url: 'http://elsewhere/' },
      }),
    });
    const caught = await axios.request({
      url: 'http://nock/',
      method: 'GET',
    }).catch(axiosVError.enhance).catch(e => e);
    expect(VError.info(caught).axios).toMatchObject({
      status: 400,
      url: 'http://nock/',
    });
  });

  test('serialize verror with extractInfo fields', async () => {
    nock('http://nock')
      .get('/')
      .reply(400, { message: 'invalid request' });
    const axiosVError = AxiosVError.configure({
      extractInfo: () => ({
        axios: { requestId: 'req-1' },
      }),
    });
    const caught = await axios.request({
      url: 'http://nock/',
      method: 'GET',
    }).catch(axiosVError.enhance).catch(e => e);
    expect(JSON.parse(JSON.stringify(VError.info(caught)))).toEqual({
      axios: {
        requestId: 'req-1',
        method: 'GET',
        url: 'http://nock/',
        status: 400,
        message: 'invalid request',
        code: 'ERR_BAD_REQUEST',
      }
    });
  });

});
