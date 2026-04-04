import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait until loading is done, then check user
  return toObservable(authService.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (authService.user()) {
        router.navigate(['/']);
        return false;
      }
      return true;
    })
  );
};
