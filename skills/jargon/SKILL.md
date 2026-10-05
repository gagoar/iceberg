---
name: jargon
description: >
  /iceberg:jargon — Build and manage the jargon list that /iceberg:edit removes and
  /iceberg:score flags (Rule 18). Pick an industry pack (technology, finance, marketing,
  corporate, legal), name your own words, or both. Writes .iceberg/jargon.txt.

  Trigger on: /iceberg:jargon, "drop these words", "ban these words", "remove jargon words",
  "my jargon list", "add <word> to the jargon list", "jargon for <industry>".

  Never writes the list without the user's confirmation.
argument-hint: "[industry | add <term> [=> replacement] | remove <term> | --show | --packs]"
allowed-tools: Read, Write, Glob, AskUserQuestion
---

# Iceberg Jargon List

Manages `.iceberg/jargon.txt` in the current working directory. Once the file exists, `/iceberg:edit` and `/iceberg:score` apply it automatically as Rule 18.

## List file format

```
# comments start with #
@pack finance            # pulls in a bundled pack
!synergy                 # keep the pack, but allow this one word
leverage => use
touch base               # bare entry: delete the phrase and repair the sentence
move the needle => improve <metric>
```

- One entry per line. `term => replacement` replaces. A bare `term` deletes.
- `@pack <name>` includes every entry from a bundled pack.
- Matching ignores case and covers whole words and phrases. Inflections match too: `leverage` also matches *leveraged* and *leveraging*.
- `!term` drops a term that a pack brought in. Use it to keep a pack but allow one word.
- If a term appears twice, the later line wins. A line in the user file therefore overrides the same term from a pack.

## Finding the bundled packs

Packs live at `skills/jargon/packs/<name>.txt` inside the plugin. Try `${CLAUDE_PLUGIN_ROOT}/skills/jargon/packs/<name>.txt` first. If that path does not resolve, Glob for `**/skills/jargon/packs/<name>.txt`. Bundled packs: `technology`, `finance`, `marketing`, `corporate`, `legal`.

## Modes

### No argument — interview

1. Ask which industry with AskUserQuestion. Offer the bundled packs. "Other" is always available.
2. Read the chosen pack and show its entries.
3. Ask which entries to keep, or whether to include the whole pack with `@pack <name>`.
4. Ask for extra words, one per line, with optional `=> replacement`.
5. Show the final file. Write `.iceberg/jargon.txt` only after the user confirms. Create `.iceberg/` if needed.

If `.iceberg/jargon.txt` already exists, read it first and offer to extend it. Never overwrite it silently.

### `<industry>` with no matching pack

Draft 30–50 entries for that industry in the file format. Prefer a plain replacement. Use a bare entry only when deletion is the right fix. Skip common words that would corrupt ordinary prose, such as *such*, *same*, *stack*, or *material*.

Show the draft and let the user cut or edit entries. After confirmation, save the entries literally. Do not write `@pack`, because no pack exists. The saved list stays fixed between runs.

### `add <term> [=> replacement]` and `remove <term>`

Edit `.iceberg/jargon.txt` in place. Create it if it does not exist (for `add`). For `remove`, delete the matching line. If the term comes from an `@pack`, add a `!term` line to the user file instead, and say so.

### `--show`

Print the merged list: packs first, then user-file entries, with later entries replacing earlier ones. Show the entry count.

### `--packs`

List each bundled pack with its entry count and three sample entries.

## Rules

- Never write or change the list without the user's confirmation, except `add` and `remove`, which the user asked for directly.
- Do not add entries the user did not choose.
- Entries are matched in prose only. Code blocks, inline code, URLs, and proper nouns are never touched.
