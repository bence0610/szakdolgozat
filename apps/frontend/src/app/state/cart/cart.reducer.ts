import { createReducer, on } from '@ngrx/store';
import { CartItem, MAX_CART_ITEMS } from '../../shared/models/cart.model';
import { CartActions } from './cart.actions';

export interface CartState {
  readonly matchId: string | null;
  readonly items: readonly CartItem[];
  readonly lastTickMs: number;
}

export const initialCartState: CartState = {
  matchId: null,
  items: [],
  lastTickMs: 0,
};

export const cartReducer = createReducer(
  initialCartState,
  on(CartActions.hydrateFromStorage, (_state, { items, matchId }) => ({
    matchId,
    items,
    lastTickMs: Date.now(),
  })),
  on(CartActions.addItem, (state, { item }) => {
    if (state.items.length >= MAX_CART_ITEMS) {
      return state;
    }
    if (state.items.some((existing) => existing.seatId === item.seatId)) {
      return state;
    }
    if (state.matchId !== null && state.matchId !== item.matchId) {
      // Switching matches resets the cart so we never mix tickets.
      return { ...state, matchId: item.matchId, items: [item] };
    }
    return {
      ...state,
      matchId: item.matchId,
      items: [...state.items, item],
    };
  }),
  on(CartActions.removeItem, (state, { seatId }) => {
    const items = state.items.filter((item) => item.seatId !== seatId);
    return {
      ...state,
      items,
      matchId: items.length === 0 ? null : state.matchId,
    };
  }),
  on(CartActions.clearCart, () => ({ ...initialCartState, lastTickMs: Date.now() })),
  on(CartActions.expireItems, (state, { seatIds }) => {
    const remaining = state.items.filter((item) => !seatIds.includes(item.seatId));
    return {
      ...state,
      items: remaining,
      matchId: remaining.length === 0 ? null : state.matchId,
    };
  }),
  on(CartActions.tick, (state, { now }) => ({ ...state, lastTickMs: now })),
  on(CartActions.replaceItemLock, (state, { seatId, ownerToken, lockExpiresAtMs }) => ({
    ...state,
    items: state.items.map((item) =>
      item.seatId === seatId ? { ...item, ownerToken, lockExpiresAtMs } : item,
    ),
  })),
);

export function getExpiredSeatIds(items: readonly CartItem[], now: number): readonly string[] {
  return items.filter((item) => item.lockExpiresAtMs <= now).map((item) => item.seatId);
}
