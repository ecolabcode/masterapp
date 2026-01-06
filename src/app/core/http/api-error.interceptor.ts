import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastStore } from '../toast/toast.store';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastStore);

  return next(req).pipe(
    catchError((err) => {
      const msg = err?.error?.message || err?.message || 'Operation failed.';
      toast.error(msg);
      return throwError(() => err);
    })
  );
};
