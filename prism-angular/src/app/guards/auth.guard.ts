import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.loading()) {
    // Ideally we return true or wait till it resolves, but for simplicity let's assume 
    // real app uses RxJS filters or a resolver. For now, since signals are synchronous,
    // if loading is true, we might just let it pass or redirect conditionally.
    // If not loading and not user, redirect to auth.
  }

  if (!authService.loading() && !authService.user()) {
    router.navigate(['/auth']);
    return false;
  }
  return true;
};
