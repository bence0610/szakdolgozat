import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideStore } from '@ngrx/store';
import { AppShellComponent } from './app-shell.component';
import { cartReducer } from '../../../state/cart/cart.reducer';
import { CART_FEATURE_KEY } from '../../../state/cart/cart.selectors';

describe('AppShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        provideStore({ [CART_FEATURE_KEY]: cartReducer }),
      ],
    }).compileComponents();
  });

  it('renders without crashing', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exposes navigation items including home and admin', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    const items = (fixture.componentInstance as unknown as { navItems: () => readonly { route: string }[] })
      .navItems();
    const routes = items.map((item) => item.route);
    expect(routes).toContain('/');
    expect(routes).toContain('/admin');
    expect(routes).toContain('/stadium');
  });
});
