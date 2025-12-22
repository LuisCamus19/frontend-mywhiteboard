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
  // 1. Redirección inicial
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // 2. Ruta Login (Pública)
  { path: 'login', component: Login },

  // 3. Ruta Dashboard (Protegida)
  {
    path: 'dashboard',
    component: Home,
    canActivate: [authGuard],
  },

  // 4. Ruta Tablero (Protegida)
  // 🔥 CORRECCIÓN AQUÍ: Cambiamos 'pizarra' por 'tablero' para coincidir con el home.component.ts
  {
    path: 'tablero/:id',
    component: Tablero,
    canActivate: [authGuard],
  },

  // 5. Comodín (Ruta no encontrada) -> Dashboard
  { path: '**', redirectTo: 'dashboard' },
];
