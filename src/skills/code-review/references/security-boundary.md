# Security boundaries

Review how untrusted actors or inputs can cross a protected boundary.

Useful investigation angles:
- authentication, authorization, ownership, and tenant isolation
- shell construction, path traversal, and filesystem access
- credential handling and private data in logs, errors, or responses
- parsing, deserialization, and upload validation
- network target control and SSRF

Identify the actor or input under their control, the reachable path, and the protected data or capability at risk. Tie the finding to the assigned diff or audit scope. Handling a sensitive API is not itself a vulnerability. Cite secret locations and types without reproducing values.
