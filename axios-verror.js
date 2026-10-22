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

// eslint-disable-next-line node/no-missing-require
const VError = require('verror');

function formatSummaryDefault(ctx) {
  const statusPrefix = ctx.status ? `[${ctx.status}] ` : '';
  const messageSuffix = ctx.message ? ` (${ctx.message})` : '';
  return `${statusPrefix}${ctx.method} ${ctx.url}${messageSuffix}`;
}

function extractMessageDefault(res) {
  return res?.data?.message || res?.data?.error?.message;
}

function trimTrailingSlash(s = '') {
  return s.replace(/\/$/, '');
}

function trimLeadingSlash(s = '') {
  return s.replace(/^\//, '');
}

function formatUrl(config) {
  if (config.baseURL) {
    return [trimTrailingSlash(config.baseURL), trimLeadingSlash(config.url)].join('/');
  }
  return config.url;
}

function enhanceError(err) {
  const config = err.config;
  if (!config) {
    throw err;
  }
  const res = err.response;
  const method = (config.method || config.type || 'GET').toUpperCase();
  const url = formatUrl(config);
  const status = res?.status;
  const code = err.code;
  const message = this.extractMessage(res);
  const ctx = {
    err,
    config,
    res,
    url,
    method,
    status,
    code,
    message,
  };
  const errorMessage = this.formatSummary(ctx);
  throw new VError({
    name: 'HttpRequestFailed',
    cause: err,
    info: {
      axios: {
        res,
        method,
        url,
        status,
        message,
        code,
        toJSON() {
          return {
            method,
            url,
            status,
            message,
            code,
          };
        }
      },
    },
  }, errorMessage);
}

function configure(opts = {}) {
  const context = {
    extractMessage: opts.extractMessage || extractMessageDefault,
    formatSummary: opts.formatSummary || formatSummaryDefault,
  };
  return { enhance: enhanceError.bind(context) };
}

const AxiosVError = {
  configure,
  enhance: configure().enhance,
  formatSummary: formatSummaryDefault,
  formatUrl,
};

module.exports = AxiosVError;
