# mine-sessions

Our own skill for mining Mel threads and proposing improvements to our workflows. It was written for us, not copied or renamed from an upstream skill. It reads Mel threads through Mel's loopback API (`GET /api/state` and `GET /api/thread`), so it must run on the Mel server's machine and cannot see archived threads.

## Inspiration

Inspired by [Cursor's pstack plugin](https://github.com/cursor/plugins/tree/main/pstack), especially:

- [automate-me](https://github.com/cursor/plugins/blob/main/pstack/skills/automate-me/SKILL.md): mine recent conversations for recurring patterns and working preferences.
- [reflect](https://github.com/cursor/plugins/blob/main/pstack/skills/reflect/SKILL.md): turn conversation learnings into skill improvements.
- Its **Encode Lessons in Structure** and **Build the Lever** principles: replace repeated manual work and fragile instructions with tools and checks.
