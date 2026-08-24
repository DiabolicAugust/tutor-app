import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createStyles, type Palette } from '@/shared/theme';

import { Icon, icons, type IconName } from './icon';
import { Text } from './text';

/** How loud the message is. Drives colour and icon, nothing else. */
export type ToastTone = 'error' | 'info' | 'success';

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

export type ToastValue = {
  /**
   * Shows a message. Takes text rather than a translation key, because callers
   * already hold `t` and the interesting ones interpolate.
   */
  show: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastValue | null>(null);

/** Long enough to read a sentence, short enough not to sit in the way. */
const VISIBLE_MS = 4_000;
/** More than this on screen and they stop being readable. */
const MAX_VISIBLE = 2;

const tone = {
  error: { fill: 'dangerSoft', text: 'danger', icon: icons.close },
  info: { fill: 'brandSoft', text: 'brand', icon: icons.news },
  success: { fill: 'successSoft', text: 'success', icon: icons.check },
} as const satisfies Record<
  ToastTone,
  { fill: keyof Palette; text: keyof Palette; icon: IconName }
>;

/**
 * Transient messages, for the failures nothing else on screen can report.
 *
 * The app already shows expected errors where they happened — a field that would
 * not save says so under itself, and that is better than a toast. This is for the
 * ones with nowhere to appear: a background load that failed, a session the
 * server stopped accepting. Those used to vanish silently, which is how an app
 * ends up looking broken rather than offline.
 *
 * Mounted above the data providers so they can reach it, and rendered over
 * everything, because a message under the screen it is about explains nothing.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, next: ToastTone = 'error') => {
      const trimmed = message.trim();
      if (!trimmed) return;

      nextId.current += 1;
      const id = nextId.current;

      setToasts((current) => {
        // Repeats are common — four screens failing on one dead connection
        // should say so once.
        if (current.some((toast) => toast.message === trimmed)) return current;
        return [...current, { id, message: trimmed, tone: next }].slice(-MAX_VISIBLE);
      });

      setTimeout(() => dismiss(id), VISIBLE_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* `pointerEvents: box-none` on the container: the messages themselves are
          tappable, the space around them is not, so a toast never blocks the
          button somebody was reaching for. */}
      <View
        style={[styles.layer, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
        // Announced without interrupting, which is what a toast is.
        accessibilityLiveRegion="polite"
      >
        {toasts.map((toast) => (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(180)}
            exiting={FadeOutUp.duration(140)}
          >
            <ToastCard toast={toast} onDismiss={() => dismiss(toast.id)} />
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const styles = useStyles();
  const { fill, text, icon } = tone[toast.tone];

  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.toast,
        styles[fill],
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={16} color={text} />
      <Text variant="bodySm" color={text} style={styles.message}>
        {toast.message}
      </Text>
    </Pressable>
  );
}

/**
 * Never throws when there is no provider.
 *
 * A missing toast host must not take a screen down with it: the message is the
 * least important thing happening at the moment something has already failed.
 */
export function useToast(): ToastValue {
  return useContext(ToastContext) ?? noopToast;
}

const noopToast: ToastValue = { show: () => undefined };

const useStyles = createStyles((t) => ({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.md,
    width: '100%',
    maxWidth: 520,
    // Raised off the screen it covers, or it reads as part of it.
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  dangerSoft: { backgroundColor: t.colors.dangerSoft },
  brandSoft: { backgroundColor: t.colors.brandSoft },
  successSoft: { backgroundColor: t.colors.successSoft },
  pressed: { opacity: 0.85 },
  message: { flex: 1 },
}));
