import { SettingsMigrator } from '.';
import { MarkpilotSettings1_2_0 } from '../versions/1.2.0';
import { MarkpilotSettings1_2_5 } from '../versions/1.2.5';

export const migrateVersion1_2_0_toVersion1_2_5: SettingsMigrator<
	MarkpilotSettings1_2_0,
	MarkpilotSettings1_2_5
> = (settings) => {
	const backup = structuredClone(settings);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const newSettings: MarkpilotSettings1_2_5 = settings as any;
	newSettings.version = '1.2.5';
	newSettings.backups['1.2.0'] = backup;
	newSettings.completions.modelTag = undefined;
	newSettings.chat.modelTag = undefined;
	return newSettings;
};
