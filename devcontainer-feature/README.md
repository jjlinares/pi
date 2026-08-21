# Pi Dev Container Feature

Installs Pi with the portable profile from this repository. Pi uses its standard agent directory by default:

```text
~/.pi/agent/
```

```json
"features": {
  "ghcr.io/jjlinares/pi/pi:1": {}
}
```

On first start after upgrading from the workspace-backed Feature, Pi copies missing legacy agent state and sessions into `~/.pi/agent` and leaves the workspace copy intact. Existing conflicting profile resources are backed up before the packaged profile is linked.

Override the directory when the container does not persist its home:

```json
"ghcr.io/jjlinares/pi/pi:1": {
  "piAgentDir": "/workspace/.pi/agent"
}
```

Sessions default to `<piAgentDir>/sessions`. The Feature has no host bind mounts.
