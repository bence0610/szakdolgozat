import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'kte-profile-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Profil</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Bejelentkezés és profilkezelés a következő iterációban kerül implementálásra.</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class ProfilePage {}
