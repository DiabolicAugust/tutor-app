import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

import { useTheme, type Palette } from '@/shared/theme';

export type IconName = {
  ios: SFSymbol;
  android: AndroidSymbol;
};

export type IconProps = {
  name: IconName;
  size?: number;
  /** Semantic palette entry; defaults to the primary text color. */
  color?: keyof Palette;
};

/**
 * Platform-native icon: SF Symbols on iOS, Material Symbols on Android and web.
 *
 * Wrapping `SymbolView` rather than using it directly keeps two things in one
 * place — the platform name shape, and the fact that a tint is a *palette*
 * entry rather than a raw color.
 */
export function Icon({ name, size = 22, color = 'text' }: IconProps) {
  const { colors } = useTheme();

  return (
    <SymbolView
      name={{ ios: name.ios, android: name.android, web: name.android }}
      size={size}
      tintColor={colors[color]}
      resizeMode="scaleAspectFit"
    />
  );
}

/**
 * The icons the app uses, named by intent. Components reference
 * `icons.filters`, never a raw symbol name, so swapping a glyph is one edit.
 */
export const icons = {
  settings: { ios: 'gearshape', android: 'settings' },
  filters: { ios: 'line.3.horizontal.decrease', android: 'filter_list' },
  add: { ios: 'plus', android: 'add' },
  close: { ios: 'xmark', android: 'close' },
  check: { ios: 'checkmark', android: 'check' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left' },
  today: { ios: 'calendar', android: 'today' },
  person: { ios: 'person', android: 'person' },
  clock: { ios: 'clock', android: 'schedule' },
  megaphone: { ios: 'megaphone', android: 'campaign' },
  wallet: { ios: 'creditcard', android: 'account_balance_wallet' },
  checkCircle: { ios: 'checkmark.circle', android: 'check_circle' },
  news: { ios: 'bell', android: 'notifications' },
  inbox: { ios: 'tray', android: 'inbox' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  arrowUp: { ios: 'arrow.up', android: 'arrow_upward' },
  arrowDown: { ios: 'arrow.down', android: 'arrow_downward' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off' },
  lock: { ios: 'lock', android: 'lock' },
  school: { ios: 'building.columns', android: 'school' },
  people: { ios: 'person.2', android: 'group' },
  mail: { ios: 'envelope', android: 'mail' },
  document: { ios: 'doc', android: 'description' },
  students: { ios: 'person.2.fill', android: 'groups' },
  note: { ios: 'square.and.pencil', android: 'edit_note' },
  journal: { ios: 'book.closed', android: 'menu_book' },
  grade: { ios: 'star', android: 'star' },
  progress: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },
  trash: { ios: 'trash', android: 'delete' },
  pencil: { ios: 'pencil', android: 'edit' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  folder: { ios: 'folder', android: 'folder' },
} as const satisfies Record<string, IconName>;
