# Target Selection

Resolve the target before any reviewer runs. Prefer explicit user input over defaults. Ask one short question when scope is ambiguous.

## Target kinds

### `local`

Use for staged, unstaged, and untracked changes.

Record in `target.md`:

```bash
git status --short
git diff --cached --stat
git diff --cached --patch --find-renames
git diff --stat
git diff --patch --find-renames
git ls-files --others --exclude-standard
```

Use the live working tree. Do not create a worktree for local changes.

### `commit <ref>`

Use for one commit, usually `HEAD` when the user says "last commit".

Resolve:

```bash
head_sha=$(git rev-parse <ref>)
base_sha=$(git rev-parse <ref>^)
```

Record:

```bash
git show --stat --format=fuller <head_sha>
git show --patch --find-renames --format=fuller <head_sha>
git show --name-only --format= <head_sha>
```

Run reviewers from a clean checkout pinned to `head_sha`.

### `branch [base]`

Use for current branch or named branch compared to a base.

If no base is supplied, use the open PR base when one exists. Otherwise detect `origin/HEAD`, then `origin/main`, then `origin/master`. Ask if none exists.

Resolve:

```bash
git fetch origin --quiet
head_sha=$(git rev-parse <branch-or-HEAD>)
base_ref=<user-base-or-origin/default>
base_sha=$(git merge-base "$base_ref" "$head_sha")
```

Record:

```bash
git diff --stat <base_sha> <head_sha>
git diff --patch --find-renames <base_sha> <head_sha>
git diff --name-only <base_sha> <head_sha>
git log --oneline <base_sha>..<head_sha>
```

### `pr [number|url]`

Use GitHub PR metadata as source of truth. Do not rely on moving local refs.

Current branch PR:

```bash
gh pr view --json number,title,body,baseRefName,headRefName,url,isDraft,state,baseRefOid,headRefOid --jq .
```

Numbered PR:

```bash
gh pr view <number> --json number,title,body,baseRefName,headRefName,url,isDraft,state,baseRefOid,headRefOid --jq .
```

Resolve:

```bash
base_sha=<baseRefOid>
head_sha=<headRefOid>
merge_base_sha=$(git merge-base "$base_sha" "$head_sha")
```

Fetch missing commits when needed:

```bash
git cat-file -e "$head_sha^{commit}" 2>/dev/null || git fetch origin "pull/<number>/head:refs/pi-review/pr-<number>"
git cat-file -e "$base_sha^{commit}" 2>/dev/null || git fetch origin <baseRefName>
```

Record:

```bash
git diff --stat <merge_base_sha> <head_sha>
git diff --patch --find-renames <merge_base_sha> <head_sha>
git diff --name-only <merge_base_sha> <head_sha>
git log --oneline <base_sha>..<head_sha>
```

### `since <ref>`

Use three-dot semantics unless the user explicitly asks for two-dot.

```bash
head_sha=$(git rev-parse HEAD)
base_sha=$(git merge-base <ref> "$head_sha")
git diff --patch --find-renames <base_sha> <head_sha>
git log --oneline <base_sha>..<head_sha>
```

### `codebase`

Use for whole-codebase audit. No introduced-by-diff requirement. Still require concrete evidence and leverage.

Record:

```bash
git rev-parse --short HEAD
find . -maxdepth 3 -type f | sort
```

Also record selected directories, skipped directories, build/test commands, and audit focus.

## Pinned checkout rule

For commit, branch, and PR targets, use one shared review checkout/worktree per review run. Subagents must not create their own worktrees.

1. Resolve `base_sha` and `head_sha`.
2. Check whether the current checkout is exactly `head_sha` and clean.
3. If not, create a detached worktree under `/tmp/pi-review-worktrees/`.
4. Run reviewers from that checkout.
5. Record cleanup commands in `target.md`.

Worktree pattern:

```bash
repo=$(git rev-parse --show-toplevel)
repo_name=$(basename "$repo")
run_id=$(basename "$run_dir")
worktree="/tmp/pi-review-worktrees/$repo_name-$run_id"
mkdir -p /tmp/pi-review-worktrees
git worktree add --detach "$worktree" "$head_sha"
```

Cleanup commands to record, not auto-run:

```bash
git worktree remove "$worktree" --force
git worktree prune
```

## Ambiguity rules

Ask before proceeding when:

- the user says only "review" and both local changes and branch commits exist
- the user says "since last commit" and intent could mean local changes or `HEAD`
- the base branch is unknown
- the diff is empty
- the target is a PR URL but `gh` cannot resolve it
