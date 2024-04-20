import { SettingsMigrator } from '.';
import { MarkpilotSettings1_1_0 } from '../versions/1.1.0';
import { MarkpilotSettings1_2_0 } from '../versions/1.2.0';
import { OPENAI_MODELS } from '../versions/1.2.0/api/providers/models';

export const migrateVersion1_1_0_toVersion1_2_0: SettingsMigrator<
  MarkpilotSettings1_1_0,
  MarkpilotSettings1_2_0
> = (settings) => {
  const newSettings: MarkpilotSettings1_2_0 = {
    version: '1.2.0',
    providers: {
      openai: {
        apiKey: settings.apiKey,
      },
      openrouter: {
        apiKey: undefined,
      },
      ollama: {
        apiUrl: 'http://127.0.0.1:11434/v1/',
      },
    },
    completions: {
      ...settings.completions,
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      ignoredFiles: [],
      ignoredTags: [],
    },
    chat: {
      ...settings.chat,
      provider: 'openai',
      model: 'gpt-3.5-turbo',
    },
    cache: {
      enabled: true, // Enable cache by default.
    },
    usage: settings.usage,
  };
  // Update if OpenAI models selected by the user are no longer available.
  // Version 1.1.0 only supported OpenAI but included models
  // that are aliased, deprecated or only preview models.
  if (!(settings.completions.model in OPENAI_MODELS)) {
    newSettings.completions.model = 'gpt-3.5-turbo';
  }
  if (!(settings.chat.model in OPENAI_MODELS)) {
    newSettings.chat.model = 'gpt-3.5-turbo';
  }
  // Update if default accept key is still selected.
  if (settings.completions.acceptKey === 'Enter') {
    newSettings.completions.acceptKey = 'Tab';
  }
  // Update if default models are still selected.
  if (settings.completions.model === 'gpt-3.5-turbo-instruct') {
    newSettings.completions.model = 'gpt-3.5-turbo';
  }
  if (settings.chat.model === 'gpt-3.5-turbo-0125') {
    newSettings.chat.model = 'gpt-3.5-turbo';
  }
  return newSettings;
};
