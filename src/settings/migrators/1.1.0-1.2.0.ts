import { SettingsMigrator } from '.';
import { MarkpilotSettings1_1_0 } from '../versions/1.1.0';
import { MarkpilotSettings1_2_0 } from '../versions/1.2.0';

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
        apiUrl: undefined,
      },
    },
    completions: {
      ...settings.completions,
      provider: 'openai',
      ignoredFiles: [],
      ignoredTags: [],
    },
    chat: {
      ...settings.chat,
      provider: 'openai',
    },
    cache: {
      enabled: true, // Enable cache by default.
    },
    usage: settings.usage,
  };
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
