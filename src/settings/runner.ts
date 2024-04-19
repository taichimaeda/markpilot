import { SettingsMigrator } from '.';
import Markpilot from '../main';
import { migrateVersion1_1_0_toVersion1_2_0 } from './migrators/1.1.0-1.2.0';

export class SettingsMigrationsRunner {
  nextMigrators: Record<string, SettingsMigrator> = {
    '1.1.0': migrateVersion1_1_0_toVersion1_2_0,
  };
  nextVersions: Record<string, string> = {
    '1.1.0': '1.2.0',
  };

  constructor(private plugin: Markpilot) {}

  async apply() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let settings = this.plugin.settings as any;

    // NOTE:
    // An infinite loop would also work because of the break statement
    // but we take the safe path here.
    const maxIterations = Object.keys(this.nextMigrators).length;
    for (let i = 0; i < maxIterations + 1; i++) {
      // Settings versions and migrations were introduced from version 1.1.0.
      const version = settings.version ?? '1.1.0';
      const migrator = this.nextMigrators[version];
      if (migrator === undefined) {
        break;
      }
      settings = migrator(settings);
      settings.version = this.nextVersions[version];
    }

    this.plugin.settings = settings;
    await this.plugin.saveSettings();
  }
}
