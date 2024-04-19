import { SettingsMigrator } from '..';
import { MarkpilotSettings1_1_0 } from '../versions/1.1.0';
import { MarkpilotSettings1_2_0 } from '../versions/1.2.0';

export const migrateVersion1_1_0_toVersion1_2_0: SettingsMigrator = (
  settings: MarkpilotSettings1_1_0,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newSettings: MarkpilotSettings1_2_0 = structuredClone(settings) as any;
  newSettings.providers = {
    openai: {
      apiKey: settings.apiKey,
    },
    openrouter: {
      apiKey: undefined,
    },
    ollama: {
      apiUrl: undefined,
    },
  };
  newSettings.completions.provider = 'openai';
  newSettings.completions.ignoredFiles = [];
  newSettings.completions.ignoredTags = [];
  newSettings.chat.provider = 'openai';
  // Update if default models are still selected.
  if (settings.completions.model === 'gpt-3.5-turbo-instruct') {
    newSettings.completions.model = 'gpt-3.5-turbo';
  }
  if (settings.chat.model === 'gpt-3.5-turbo-0125') {
    newSettings.chat.model = 'gpt-3.5-turbo';
  }
  return newSettings;
};
