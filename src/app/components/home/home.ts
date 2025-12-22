import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Salasservice } from '../../services/salasservice';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  public misSalas: any[] = [];
  public salasCompartidas: any[] = [];
  public seccionActual: string = 'MIS_SALAS';
  public nuevoNombre: string = '';
  public usuarioActual: string = '';

  // Variables Responsive
  public isMobile: boolean = false;

  constructor(
    private router: Router,
    private authService: Authservice,
    private salasService: Salasservice,
    private breakpointObserver: BreakpointObserver
  ) {
    this.usuarioActual = this.authService.getUsername();
  }

  ngOnInit() {
    this.cargarSalas();
    this.cargarCompartidas();

    // 🔥 Detectar cambios de pantalla (Móvil vs Escritorio)
    // Breakpoints.Handset incluye teléfonos y tablets en vertical
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  cargarSalas() {
    this.salasService.listarMisSalas().subscribe((data) => (this.misSalas = data));
  }

  cargarCompartidas() {
    this.salasService.listarCompartidas().subscribe((data) => (this.salasCompartidas = data));
  }

  crearSala() {
    if (!this.nuevoNombre.trim()) return;
    const nuevaSala = { titulo: this.nuevoNombre };
    this.salasService.crearSala(nuevaSala).subscribe((salaCreada) => {
      this.misSalas.push(salaCreada);
      this.nuevoNombre = '';
    });
  }

  borrarSala(salaId: string, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar esta pizarra?')) {
      this.salasService.borrarSala(salaId).subscribe(() => {
        this.misSalas = this.misSalas.filter((s) => s.id !== salaId);
      });
    }
  }

  irASala(salaId: string) {
    this.router.navigate(['/tablero', salaId]);
  }

  abrirInvitar(salaId: string, event: Event) {
    event.stopPropagation();
    const username = prompt('Ingresa el usuario a invitar:');
    if (username) {
      this.salasService.agregarColaborador(salaId, username).subscribe({
        next: () => alert('✅ Invitación enviada'),
        error: () => alert('❌ Error: Usuario no encontrado o error de red'),
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
