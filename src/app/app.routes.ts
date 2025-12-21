import { Router, Routes } from '@angular/router';
import { App } from './app';
import { Tablero } from './components/tablero/tablero';
import { Home } from './components/home/home';
import { inject } from '@angular/core';
import { Authservice } from './services/authservice';
import { Login } from './components/login/login';

// GUARD: Función simple para proteger rutas
const authGuard = () => {
  const authService = inject(Authservice);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

export const routes: Routes = [
  // 1. Si la ruta está vacía, redirigir a dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // 2. Ruta Login (Pública)
  { path: 'login', component: Login },

  // 3. Ruta Dashboard (Protegida) -> Aquí renderizamos el HomeComponent
  {
    path: 'dashboard',
    component: Home,
    canActivate: [authGuard],
  },

  // 4. Ruta Pizarra (Protegida)
  {
    path: 'pizarra/:id',
    component: Tablero,
    canActivate: [authGuard],
  },

  // 5. Cualquier otra cosa -> redirigir a dashboard (o a una página 404 si tuvieras)
  { path: '**', redirectTo: 'dashboard' },
];
