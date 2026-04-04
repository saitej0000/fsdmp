import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.loading()) {
    if (authService.user()) {
      router.navigate(['/']);
      return false;
    }
    return true;
  }

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (!authService.loading()) {
        clearInterval(checkInterval);
        if (authService.user()) {
          router.navigate(['/']);
          resolve(false);
        } else {
          resolve(true);
        }
      }
    }, 50);

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(true);
    }, 5000);
  });
};
