import { Component } from '@angular/core';
import { Authservice } from '../../services/authservice';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  usuario = { username: '', password: '' };
  isLoginMode = true;

  constructor(
    private authService: Authservice,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  submit() {
    if (this.isLoginMode) {
      this.login();
    } else {
      this.register();
    }
  }

  login() {
    if (!this.usuario.username || !this.usuario.password) {
      this.snackBar.open('⚠️ Ingresa usuario y contraseña', 'Cerrar', { duration: 3000 });
      return;
    }

    this.authService.login(this.usuario).subscribe({
      next: (res: any) => {
        // 🔥 CAMBIO AQUÍ: Redirigir a /dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const msg = err.error?.error || 'Credenciales incorrectas';
        this.snackBar.open(`❌ ${msg}`, 'Cerrar', { duration: 3000 });
      },
    });
  }

  register() {
    if (!this.usuario.username || !this.usuario.password) {
      this.snackBar.open('⚠️ Por favor completa todos los campos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.authService.register(this.usuario).subscribe({
      next: (res: any) => {
        const mensaje = res.mensaje || '¡Registro exitoso!';
        this.snackBar.open(`✅ ${mensaje}`, 'Ok', { duration: 4000 });
        this.isLoginMode = true;
        this.usuario.password = '';
      },
      error: (err) => {
        const mensajeError = err.error?.error || 'Ocurrió un error en el registro';
        this.snackBar.open(`❌ ${mensajeError}`, 'Cerrar', { duration: 4000 });
      },
    });
  }
}
