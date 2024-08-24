# gh-proxy

## Introduction

Speed up the downloading of GitHub resources.</br>
Powered by [Cloudflare Workers](https://developers.cloudflare.com/workers/).

## Usage

1. Add your worker URL before the copied URL.
2. Fetch the URL via `curl`, `wget`, `git clone`, etc.

```bash
# Example
git clone https://myworker.url/https://github.com/xxx/yyy.git
```

## Development/Deployment

Prerequisites:

- [node](https://nodejs.org/en/)
- [wrangler](https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler)

### Development

```bash
npm install
npm run dev
```

### Deployment

```bash
npm run deploy
```

## Credit

[jsproxy](https://github.com/EtherDream/jsproxy/)</br>
[gh-proxy](https://github.com/hunshcn/gh-proxy)
