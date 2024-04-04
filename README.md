# Markpilot

![workflow](https://github.com/taichimaeda/markpilot/actions/workflows/ci.yaml/badge.svg)
![semver](https://img.shields.io/badge/semver-1.0.0-blue)

Markpilot is an Obsidian plugin that offers _inline completions_ features and _chat view_ in the sidebar. It is powered by the OpenAI API and aims to provide a similar experience to [GitHub Copilot](https://github.com/features/copilot) in Obsidian.

There are well-known plugins that provide similar features, such as [Obsidian Companion](https://github.com/rizerphe/obsidian-companion) for AI-powered auto-completions, and [Obsidian Copilot](https://github.com/logancyang/obsidian-copilot) for chat UI. However, Markpilot is designed as a _GitHub Copilot_-flavored alternative that provides _both_ features in one plugin, with more sophisticated UI/UX such as:

- Context-aware completions
  - Detects the language of a Markdown code block.
  - Feeds only the content within the code block to generate completions.
- Better handling of inline completions
  - Force completions before waiting time by hitting `Tab` twice.
  - Reject completions by hitting `Esc` key.
- Fast in-memory caching to save usage costs

Markpilot also comes with visualization of usage costs similar to [OpenAI API Platform](https://platform.openai.com/usage), and the fact that Markpilot offers both features in one plugin makes it a more convenient choice for users who want to manage their usage costs in one place.

As mentioned, Markpilot's chat view is inspired by [GitHub Copilot for VSCode](https://code.visualstudio.com/docs/copilot/overview). Furthermore, the implementation for the CodeMirror extension used for inline completions is inspired by [codemirror-copilot](https://github.com/asadm/codemirror-copilot).

## Demo

### Inline Completions

[Inline Completions Demo](https://github.com/taichimaeda/markpilot/assets/28210288/5659c12b-22d2-4427-ad98-c4376c7718d8)

### Chat View

[Chat View Demo](https://github.com/taichimaeda/markpilot/assets/28210288/a4ba56a9-9672-4560-a4a4-829a3cfeceed)

## Getting Started

Markpilot requires an OpenAI API key to work. You can get the API key from [OpenAI API](https://platform.openai.com/docs/guides/authentication).

1. Install the plugin from the Obsidian community plugins.
2. Under the plugin settings, go to **Community Plugins** > **Markpilot** > **OpenAI** > **OpenAI API Key** and enter your OpenAI API key.
3. Optionally customize the plugin settings to your preference, and enable caching if you want to save usage costs.
4. You're all set - enjoy using Markpilot!

## Features

- Inline completions
  - Context-are completions as you type.
  - Force accepting completions by hitting `Tab` twice.
  - Reject completions by hitting `Esc` key.
  - Enable/disable completions from the command palette.
- Chat view
  - Open chat view from the sidebar.
  - Send message by hitting `Enter`, add a new line by hitting `Shift + Enter`.
  - Clear chat history from the command palette.
- Caching
  - In-memory cache to save usage costs
  - Completions are lost after reloading the plugin or Obsidian.
- Usage
  - Set a monthly usage limit to automatically disable features when the limit is reached.
  - Monitor usage costs in a graph from the settings tab.
  - The costs are estimated based on the number of tokens used for completions.

## Customization

You can customize most of the plugin settings from the settings tab.

The ones you might want to customize are:

- Model
  - Change the model to GPT-4 might give you better completions but will cost more.
  - You can select any of the models provided by [OpenAI's Node API](https://github.com/openai/openai-node), but some of the less popular models might not work as expected or give you incorrect cost estimations.
- Temperature
  - The higher the temperature, the more creative completions you get.
  - The lower the temperature, the more conservative completions you get.
- Window size
  - This determines the number of _characters_ fed into the model to generate inline completions.
  - The longer the window size, the more context-aware completions you get, but it will take longer to generate completions and result in hitting the cache less often.
- Wait time
  - The time to wait before sending the content to the model to generate completions.
