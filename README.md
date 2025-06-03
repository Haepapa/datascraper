# datascraper

## Setup

```bash
uv python install 3.11
uv venv --python 3.11
uv pip install -r requirements.txt
```

### Mac

```bash
brew tap azure/functions
brew install azure-functions-core-tools@4

# if upgrading on a machine that has 2.x or 3.x installed:
brew link --overwrite azure-functions-core-tools@4
```

### WSL
```bash
uv python install 3.11
uv venv --python 3.11

# if python version file is not present
uv python pin 3.11
```
`ctrl+shit+p` and select venv python for interpreter.