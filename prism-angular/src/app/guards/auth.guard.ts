import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If already resolved, check immediately
  if (!authService.loading()) {
    if (!authService.user()) {
      router.navigate(['/auth']);
      return false;
    }
    return true;
  }

  // Otherwise wait for Firebase auth state to resolve (max 5s)
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (!authService.loading()) {
        clearInterval(checkInterval);
        if (!authService.user()) {
          router.navigate(['/auth']);
          resolve(false);
        } else {
          resolve(true);
        }
      }
    }, 50);

    // Timeout fallback - redirect to auth after 5s if still loading
    setTimeout(() => {
      clearInterval(checkInterval);
      router.navigate(['/auth']);
      resolve(false);
    }, 5000);
  });
};
