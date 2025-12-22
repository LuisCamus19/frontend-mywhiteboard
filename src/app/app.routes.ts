import { Router, Routes } from '@angular/router';
import { App } from './app';
import { Tablero } from './components/tablero/tablero';
import { Home } from './components/home/home';
import { inject } from '@angular/core';
import { Authservice } from './services/authservice';
import { Login } from './components/login/login';
import { Notebook } from './components/notebook/notebook';

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
  // Aquí vive el "FileExplorer" dentro del Home
  {
    path: 'dashboard',
    component: Home,
    canActivate: [authGuard],
  },

  // 4. Ruta Tablero (Protegida) -> Pizarra Infinita
  {
    path: 'tablero/:id',
    component: Tablero,
    canActivate: [authGuard],
  },

  {
    path: 'cuaderno/:id',
    component: Notebook,
    canActivate: [authGuard],
  },

  // 6. Comodín (Ruta no encontrada) -> Dashboard
  { path: '**', redirectTo: 'dashboard' },
];
