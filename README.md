# [WIP] Web3

![Login Page](assets/login-page.png)

## Installation

```bash
$ bun install
```

## Development

Install pre-commit:

```bash
$ python -m venv venv
$ venv/bib/activate
$ pip install pre-commit
$ pre-commit install
```

Run Ganache + Server:

```bash
$ docker compose up
```

Run the end-to-end:

```bash
$ bun run playwright test
```
