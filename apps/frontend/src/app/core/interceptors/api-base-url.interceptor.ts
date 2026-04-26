import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Prefixes relative requests (`/foo/bar`) with the configured backend base URL.
 * Absolute URLs (http://, https://) are passed through untouched so the same
 * HttpClient instance can call third-party APIs when needed.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const baseUrl = environment.apiUrl.replace(/\/$/, '');
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  return next(req.clone({ url: `${baseUrl}${path}` }));
};
