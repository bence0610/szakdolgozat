import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { CartEffects } from './cart.effects';
import { cartReducer } from './cart.reducer';
import { CART_FEATURE_KEY } from './cart.selectors';

export const provideCartFeature = () => [
  provideState(CART_FEATURE_KEY, cartReducer),
  provideEffects(CartEffects),
];
