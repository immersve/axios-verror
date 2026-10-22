# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Added
- default `formatSummary()` and `formatUrl()` exported for reuse in custom formatters

### Changed
- `formatSummary()` option receives the full error context, including request config and original error

## 1.4.3 - 2026-10-05
### Changed
- refresh lockfile to re-resolve node-gyp, picking up security patches for dev dependencies (tar, ip-address)

## 1.4.2 - 2026-10-02
### Changed
- publish to NPM using trusted publishing (OIDC). 1.4.1 was tagged but never published to NPM, so this release includes its changes

## 1.4.1 - 2026-10-02
### Changed
- refresh lockfile to pick up security patches for dev dependencies (axios, js-yaml, brace-expansion, browserslist, minimatch, picomatch, glob, flatted, form-data, follow-redirects, @babel/core)

## 1.4.0
### Changed
- "code" added to VError info to expose error codes from axios or underlying system (e.g., ECONNRESET, ERR_BAD_REQUEST)

## 1.2.3 - 2025-06-02
### Changed
- upgraded node engine requirement

## 1.2.2 - 2024-10-28
### Changed
- refresh lockfile to remove references to @babel/traverse<7.23.2

## 1.2.1 - 2024-10-21
### Changed
- upgraded axios dependency
- upgraded eslint dependency
- upgraded jest dependency

## 1.2.0 - 2022-09-19
### Added
- toJSON() implemented on VError info which excludes "res" attribute

## 1.1.1 - 2022-03-30
### Fixed
- "url" formatted correctly when baseURL used

## 1.1.0 - 2022-03-26
### Added
- "res" added to VError info

## 1.0.0 - 2022-03-25
### Added
- initial release
