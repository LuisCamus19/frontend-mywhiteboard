import { HttpInterceptorFn } from '@angular/common/http';

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  // Recuperamos el token del navegador
  const token = localStorage.getItem('token_pizarra');

  // Si existe token, clonamos la petición y le pegamos la cabecera
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(authReq);
  }

  // Si no hay token, la dejamos pasar tal cual (para el login/register)
  return next(req);
};
