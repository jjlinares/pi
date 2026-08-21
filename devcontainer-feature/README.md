# Pi Dev Container Feature

Installs Pi with the portable profile from this repository:

```json
"features": {
  "ghcr.io/jjlinares/pi/pi:1": {}
}
```

Override Pi's agent directory with `piAgentDir`:

```json
"ghcr.io/jjlinares/pi/pi:1": {
  "piAgentDir": "/workspace/.pi/agent"
}
```

The Feature has no host bind mounts.
