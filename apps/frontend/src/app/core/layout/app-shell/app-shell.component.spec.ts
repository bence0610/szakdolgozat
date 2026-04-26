import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
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
