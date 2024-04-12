# 🤖 Markpilot: AI-powered inline completions and chat view for Obsidian

![workflow](https://github.com/taichimaeda/markpilot/actions/workflows/ci.yaml/badge.svg)
![semver](https://img.shields.io/badge/semver-1.0.9-blue)

Markpilot is an Obsidian plugin that offers _inline completions_ features and _chat view_ in the sidebar. It is powered by the OpenAI API and aims to provide a similar experience to [GitHub Copilot](https://github.com/features/copilot) in Obsidian.

There are well-known plugins that provide similar features, such as [Obsidian Companion](https://github.com/rizerphe/obsidian-companion) for AI-powered auto-completions, and [Obsidian Copilot](https://github.com/logancyang/obsidian-copilot) for chat UI. However, Markpilot is designed to be a _GitHub Copilot-flavored_ alternative that provides _both features_ in one plugin, with more sophisticated UI/UX, including:

- Context-aware completions
  - Detects the language of a Markdown code block.
  - Feeds only the content within a code block to generate relevant completions.
- Better handling of inline completions
  - Force completions before waiting time by hitting `Tab` twice.
  - Reject completions by hitting `Esc` key.
- Fast in-memory caching to save costs.

Markpilot also comes with a bar chart visualization of usage similar to [OpenAI API Platform](https://platform.openai.com/usage), and the fact that Markpilot offers both features in one plugin makes it a more convenient choice for users who want to manage their API usage in one place.

As mentioned, Markpilot's chat view UI is heavily inspired by [GitHub Copilot for VSCode](https://code.visualstudio.com/docs/copilot/overview). Also, I took some inspirations from [codemirror-copilot](https://github.com/asadm/codemirror-copilot) for the implementation of the CodeMirror extension used for Markpilot's inline completions.

## Demo

### Inline Completions

[Inline Completions Demo](https://github.com/taichimaeda/markpilot/assets/28210288/5659c12b-22d2-4427-ad98-c4376c7718d8)

### Chat View

[Chat View Demo](https://github.com/taichimaeda/markpilot/assets/28210288/a4ba56a9-9672-4560-a4a4-829a3cfeceed)

## Getting Started

Markpilot requires an OpenAI API key to work, which you can obtain from [OpenAI API](https://platform.openai.com/docs/guides/authentication).

1. Install the plugin from the Obsidian community plugins.
2. Under the plugin settings, go to **Community Plugins** > **Markpilot** > **OpenAI** > **OpenAI API Key** and enter your OpenAI API key.
3. Optionally customize the plugin settings to your preference, and enable caching if you want to save usage costs.
4. You're all set - enjoy using Markpilot!

## Caveats

This plugin sends your content to the OpenAI API to generate completions.

You should be cautious about sending sensitive information to the API, and be aware of the costs associated with using the API. The plugin provides a usage limit feature to help you manage your costs, but it is your responsibility to monitor your usage and costs.

## Features

- Inline completions
  - Context-aware completions as you type.
  - Force completions before waiting time by hitting `Tab` twice.
  - Reject completions by hitting `Esc` key.
  - Enable/disable completions from the command palette.
- Chat view
  - Open chat view from the sidebar.
  - Send message by hitting `Enter`, add a new line by hitting `Shift + Enter`.
  - Clear chat history from the command palette.
- Caching
  - In-memory cache to save costs
  - Completions are lost after reloading the plugin or Obsidian.
- Usage
  - Set a monthly usage limit to automatically disable features when the limit is reached.
  - Monitor costs in a graph from the settings tab.
  - These costs are estimated based on the number of tokens used for completions.

## Customization

You can customize most of the plugin settings from the settings tab.

Some of the settings you will likely want to customize:

- Model
  - Changing the model to GPT-4 may give you better completions, but this will cost more.
  - You can select any of the models provided by [OpenAI's Node API](https://github.com/openai/openai-node), but some of the less common models may not work as expected or give you incorrect cost estimates.
- Temperature
  - The higher the temperature, the more creative completions you get.
  - The lower the temperature, the more conservative completions you get.
- Window size
  - The window size determines the number of _characters_ fed into the model to generate inline completions.
  - The longer the window size, the more context-aware completions you get, but it will take longer to generate completions and result in hitting the cache less often.
- Wait time
  - The time in milliseconds to wait before sending the content to the model to generate completions.

## Frequently Asked Questions

### How do I get an OpenAI API key?

You can obtain an OpenAI API key from [OpenAI API](https://platform.openai.com/docs/guides/authentication).

### I can't accept completions by hitting `Tab`.

Currently some extensions like [Obsidian Outliner](https://github.com/vslinko/obsidian-outliner) use the `Tab` key for their own purposes, which will conflict with Markpilot's completions.

Although I could not find documentation on this, it seems like the keybindings are loaded in the order of when the plugins got enabled, so you can try disabling the conflicting plugin and enabling it again to prioritise Markpilot's keybindings.
