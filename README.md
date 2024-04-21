# 🤖 Markpilot: AI-powered inline completions and chat view for Obsidian

![workflow](https://github.com/taichimaeda/markpilot/actions/workflows/ci.yaml/badge.svg)
![semver](https://img.shields.io/badge/semver-1.2.0-blue)

Markpilot is an Obsidian plugin that offers _inline completions_ features and _chat view_ in the sidebar. It aims to provide a similar experience to [GitHub Copilot](https://github.com/features/copilot) in Obsidian.

Currently the plugin supports models provided by OpenAI API, OpenRouter API and **local models** by Ollama. We are planning to support more providers in the future, such as Gemini Pro API.

There are plugins that provide similar features, such as [Obsidian Companion](https://github.com/rizerphe/obsidian-companion) and [Obsidian Copilot Autocompletion](https://github.com/j0rd1smit/obsidian-copilot-auto-completion) for AI-powered auto-completions, and [Obsidian Copilot](https://github.com/logancyang/obsidian-copilot) for chat UI.

However, Markpilot is designed to be a _GitHub Copilot-flavored_ alternative that provides _both features_ in one plugin, with more sophisticated UI/UX, including:

- Context-aware inline completions.
  - Detects the context of a Markdown content, and uses an optimised system prompt for each.
    - e.g. List, heading, code block
  - Detects the language of a Markdown code block, and enforces the model to use the same language.
    - e.g. Python, JavaScript
- Advanced prompting techniques (Beta)
  - Context-aware system prompts.
  - Context-aware few-shot examples to guide the model to generate more accurate completions.
- Carefully-designed user experience.
  - Force completions before waiting time by hitting `Tab` twice.
  - Reject completions by hitting `Esc` key.
  - Send a chat message by hitting `Enter`, add a new line by hitting `Shift + Enter`.
- Usage limit feature to manage costs.
- Fast in-memory caching to save costs.
- Disable inline completions features by filename and tags.

Markpilot also comes with a bar chart visualization of usage similar to [OpenAI API Platform](https://platform.openai.com/usage), and the fact that Markpilot offers both features in one plugin makes it a more convenient choice for users who want to manage their API usage in one place.

Markpilot's chat view UI is heavily inspired by [GitHub Copilot for VSCode](https://code.visualstudio.com/docs/copilot/overview), and the CodeMirror extension by [codemirror-copilot](https://github.com/asadm/codemirror-copilot). Also I took inspirations from [Obsidian Copilot Autocompletion](https://github.com/j0rd1smit/obsidian-copilot-auto-completion) to implement the few-shot prompts feature.

## Demo

### Inline Completions

[Inline Completions Demo](https://github.com/taichimaeda/markpilot/assets/28210288/5659c12b-22d2-4427-ad98-c4376c7718d8)

### Chat View

[Chat View Demo](https://github.com/taichimaeda/markpilot/assets/28210288/a4ba56a9-9672-4560-a4a4-829a3cfeceed)

## Getting Started

Markpilot currently supports OpenAI API, OpenRouter API and Ollama as providers for inline completions and chat view.

### Using OpenAI API

First, you need to obtain the API key from [OpenAI API](https://platform.openai.com/docs/guides/authentication).

1. Install the plugin from the Obsidian community plugins.
2. Navigate to the plugin settings:
   1. Under **Providers** > **OpenAI API Key**, enter your OpenAI API key.
   2. Under **Inline completions** > **Provider**, select **OpenAI**.
   3. Under **Inline completions** > **Model**, select the model you want to use (Recommended: `gpt-3.5-turbo`).
   4. Repeat the same steps for the chat view settings under **Chat view**.
3. You're all set! Enjoy using Markpilot.

### Using OpenRouter API

First, you need to obtain the API key from [OpenRouter API](https://openrouter.ai/keys).

1. Install the plugin from the Obsidian community plugins.
2. Navigate to the plugin settings:
   1. Under **Providers** > **OpenRouter API Key**, enter your OpenRouter API key.
   2. Under **Inline completions** > **Provider**, select **OpenRouter**.
   3. Under **Inline completions** > **Model**, select the model you want to use (Recommended: `gpt-3.5-turbo`).
   4. Repeat the same steps for the chat view settings under **Chat view**.
3. You're all set! Enjoy using Markpilot.

### Using Ollama (MacOS, Linux, Windows - Preview)

First, download [Ollama](https://ollama.com/download) and follow the instructions to install it.

Now you need to pull the local model of your choice from Ollama (Recommended: `llama2`).

```console
$ ollama pull --model llama2
```

This will take some time. Once the model is downloaded, you can start the Ollama server:

```console
$ ollama serve
```

If you are on MacOS, the server should start automatically when you login.
If you are on Linux, you may need to configure the startup service manually: [Ollama on Linux](https://github.com/ollama/ollama/blob/main/docs/linux.md)

Now you can install Markpilot and set it up to use Ollama:

1. Install the plugin from the Obsidian community plugins.
2. Navigate to the plugin settings:
   1. Under **Providers**, click **Test Ollama Connection** and see if the Ollama server is running correctly.
   2. Under **Inline completions** > **Provider**, select **Ollama**.
   3. Under **Inline completions** > **Model**, select the model you want to use (Recommended: `llama2`).
      - Make sure to only select the same model you pulled from Ollama.
   4. Repeat the same steps for the chat view settings under **Chat view**.
3. You're all set! Enjoy using Markpilot.

## Caveats

If you use the OpenAI API or OpenRouter API, this plugin will send your content to the OpenAI API to generate completions.

You should be cautious about sending sensitive information to the API, and be aware of the costs associated with using the API. The plugin provides a usage limit feature to help you manage your costs, but it is your responsibility to monitor your usage and costs.

## Features

- Providers
  - Support for OpenAI API, OpenRouter API and **local** models available on Ollama.
  - Providers and models are customisable independently for inline completions and chat view.
- Inline completions
  - Context-aware system prompts.
  - Context-aware few-shot examples to guide the model to generate more accurate completions.
- Chat view
  - Open chat view from the sidebar.
  - Clear chat history from the command palette.
  - Stop chat response by clicking the stop button.
- Caching
  - In-memory cache to save costs (will be cleared when Obsidian restarts).
- Filtering
  - Disable inline completions features by filename (glob) and tags (regex).
- Usage
  - Set a monthly usage limit to automatically disable features when the limit is reached.
  - Monitor costs in a graph from the settings tab.

## Frequently Asked Questions

### I can't accept completions by hitting `Tab`.

Currently some extensions like [Obsidian Outliner](https://github.com/vslinko/obsidian-outliner) use the `Tab` key for their own purposes, which will conflict with Markpilot's completions.

Although I could not find documentation on this, it seems like the keybindings are loaded in the order of when the plugins got enabled, so you can try disabling the conflicting plugin and enabling it again to prioritise Markpilot's keybindings.
