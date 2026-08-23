import { useT } from '@/shared/i18n';
import { themeModes, useThemeController, type ThemeMode } from '@/shared/theme';

import { SegmentedControl } from './segmented-control';

/**
 * Appearance picker (System / Light / Dark). Drop it into a settings screen;
 * the choice is persisted by `ThemeProvider`.
 */
export function ThemeModeSwitcher() {
  const { t } = useT();
  const { mode, setMode } = useThemeController();

  const options = themeModes.map((value: ThemeMode) => ({
    value,
    label: t(`settings.appearance.${value}`),
  }));

  return (
    <SegmentedControl
      options={options}
      value={mode}
      onChange={setMode}
      accessibilityLabel={t('settings.appearance.title')}
    />
  );
}
