import { SettingsMigrator } from '.';
import Markpilot from '../main';
import { migrateVersion1_1_0_toVersion1_2_0 } from './migrators/1.1.0-1.2.0';

export class SettingsMigrationsRunner {
  migrators: Record<string, SettingsMigrator> = {
    '1.1.0': migrateVersion1_1_0_toVersion1_2_0,
  };

  constructor(private plugin: Markpilot) {}

  async apply() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let settings = this.plugin.settings as any;

    while (true) {
      // Settings versions and migrations were introduced from version 1.1.0.
      const version = settings.version ?? '1.1.0';
      const migrator = this.migrators[version];
      if (migrator === undefined) {
        break;
      }
      settings = migrator(settings);
    }

    this.plugin.settings = settings;
    await this.plugin.saveSettings();
  }
}
