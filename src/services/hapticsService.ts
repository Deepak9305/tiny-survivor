import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const HapticsService = {
  async light(enabled = true) {
    if (!enabled) return;
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* web no-op */ }
  },
  async medium(enabled = true) {
    if (!enabled) return;
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* web no-op */ }
  },
  async success(enabled = true) {
    if (!enabled) return;
    try { await Haptics.notification({ type: NotificationType.Success }); } catch { /* web no-op */ }
  },
  async heavy(enabled = true) {
    if (!enabled) return;
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch { /* web no-op */ }
  },
};
