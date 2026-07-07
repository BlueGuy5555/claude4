/**
 * One-time purchase entitlement.
 *
 * RepCam is "buy once, own forever" — there is no subscription and no server to
 * validate against. The app depends only on the {@link EntitlementService}
 * interface below.
 *
 * The shipped default is {@link LocalEntitlementService}, which persists the
 * unlocked flag on the device. That keeps the whole app runnable in Expo Go and
 * during development. To wire a *real* store purchase for production, implement
 * this same interface with `react-native-iap` (or `expo-in-app-purchases`):
 *
 *   - purchase(): request the non-consumable product, then on success persist
 *     the entitlement locally.
 *   - restore(): query past purchases and re-persist if the product is owned.
 *
 * Because the surface is just three methods, swapping the implementation in
 * `AppProviders` is a one-line change and no screen code needs to know.
 */
import { StorageKeys, readJson, writeJson } from './storage';

export interface EntitlementService {
  /** Whether the user has unlocked the full app. */
  isEntitled(): Promise<boolean>;
  /** Run the purchase flow; resolves to the new entitlement state. */
  purchase(): Promise<boolean>;
  /** Restore a previous purchase (e.g. new device); resolves to entitlement. */
  restore(): Promise<boolean>;
  /** The displayable one-time price. */
  readonly price: string;
}

interface EntitlementState {
  entitled: boolean;
}

export class LocalEntitlementService implements EntitlementService {
  readonly price = '$4.99';

  async isEntitled(): Promise<boolean> {
    const state = await readJson<EntitlementState>(StorageKeys.entitlement, { entitled: false });
    return state.entitled;
  }

  async purchase(): Promise<boolean> {
    // A real implementation would await the store transaction here.
    await writeJson<EntitlementState>(StorageKeys.entitlement, { entitled: true });
    return true;
  }

  async restore(): Promise<boolean> {
    return this.isEntitled();
  }
}
