# iceberg

A Claude Code plugin that applies Hemingway writing rules to technical documentation.

Named after Hemingway's iceberg theory: the strength of a document comes from what you cut, not what you add.

## What it does

`/iceberg:edit` rewrites any technical document — plans, specs, proposals, READMEs — using 14 rules drawn from the Hemingway App, Google Developer Docs, and Microsoft Writing Style Guide. It applies inline replacements and returns the clean document. No annotations. No changelog.

It also runs automatically on every plan and output document Claude generates.

## Install

```
/plugin marketplace add gagoar/iceberg
/plugin install iceberg@iceberg
/reload-plugins
```

## Usage

**Edit a file:**
```
/iceberg:edit path/to/document.md
```

**Edit pasted text:**
```
/iceberg:edit
```
Then paste your text. The skill returns the rewritten version.

**Automatic mode:**
Add this to your `CLAUDE.md`:
```
Apply /iceberg:edit to every plan and output document before returning it.
```

## The 14 Rules

| # | Rule | Example |
|---|------|---------|
| 1 | Short sentences | Target 15–20 words. Split at 30. |
| 2 | Active voice | "The server loads the config" — not "The config is loaded" |
| 3 | Strong verbs, no adverbs | "stalls" — not "runs slowly" |
| 4 | No qualifiers or hedges | Delete: *very, quite, arguably, tends to, could potentially* |
| 5 | Concrete nouns | "add a retry loop" — not "implement a comprehensive solution" |
| 6 | One idea per sentence | Break at "and," "which," or "but" when each side stands alone |
| 7 | Conditions before instructions | "If the cache is cold, run the script" — not the reverse |
| 8 | Lead with the answer | Conclusion first. Context follows. |
| 9 | Second person | "You configure the server" — not "We recommend" |
| 10 | Simple words | use, help, start, stop — not utilize, facilitate, initiate, terminate |
| 11 | No negative framing | "Use HTTPS" — not "Don't use HTTP" |
| 12 | Short paragraphs | 2–4 sentences. One topic. |
| 13 | Define or cut jargon | First use gets an inline definition. Plain equivalent beats jargon. |
| 14 | Measure, don't describe | "under 100ms" — not "fast" |

## What it doesn't touch

Code blocks, inline code, command names, variable names, URLs, and proper nouns are never modified.

## Long documents

For documents over 500 words, the skill spawns a subagent. The main context window stays clean.

## License

MIT — [gagoar](https://github.com/gagoar)
