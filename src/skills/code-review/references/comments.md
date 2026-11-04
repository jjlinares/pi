# Comments

Review comments and suppressions that hide unclear code. A comment explaining confusing code we own is usually a request to improve the code. Prefer names, types, structure, validation, and tests over prose.

Useful investigation angles:
- comments that narrate code, preserve dead code, justify workarounds, or compensate for poor structure
- suppressions such as `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `noqa`, or `type: ignore`
- `IMPORTANT`, `do not remove`, `fine for now`, and long justifications: treat them as leads, not proof; read the nearby code and its git history, and keep the comment only if the constraint holds today

Keep legal headers, tool-consumed directives, public or app-facing contracts, current issue or ADR links, and verified constraints imposed by systems we cannot change. A narrow style-only suppression may stay. When unsure whether a keep applies, flag the comment for deletion.

For each finding, state whether the comment can simply go or requires reshaping the code it explains. Fix direction is the smallest root-cause change that makes the code clear without the comment. Never shorten a bad comment into a smaller excuse or add symptom guards. Fix correctness, security, and type-checker suppressions rather than replacing them with casts or broader suppressions. Encode important constraints in a type, boundary check, focused test, lint rule, or canonical document when cheap; otherwise keep the comment and note the open work. For protected files, such as generated code or applied migrations, point the fix at their source.

Plain deletions are P3. A suppression hiding a real error takes that error's severity.
