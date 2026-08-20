# pi-zed-terminal-status

Pi extension for Zed Terminal Threads.

It exposes Pi's simple lifecycle through the terminal title:

- `⠋ π - ...` while Pi is processing a prompt
- `○ π - ...` when Pi is waiting for input

It also emits a terminal bell on `agent_end`, which Zed uses for Terminal Thread notifications.

Disable per process with:

```sh
PI_ZED_TERMINAL_STATUS=0 pi
```
