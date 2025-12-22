import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { Salasservice } from '../../services/salasservice';

@Component({
  selector: 'app-dialogo-colaboradores',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Invitar Colaboradores</h2>
      <button mat-icon-button (click)="dialogRef.close()" class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="search-box">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar usuario por nombre</mat-label>
          <input
            matInput
            [(ngModel)]="filtro"
            (keyup.enter)="buscar()"
            placeholder="Ej: luis"
            autocomplete="off"
          />
          <mat-icon matSuffix (click)="buscar()" style="cursor: pointer">search</mat-icon>
        </mat-form-field>
      </div>

      <div class="results-container">
        <div class="subtitle" *ngIf="busco">Resultados de la búsqueda</div>

        <mat-list>
          <mat-list-item *ngFor="let user of resultados" class="user-item">
            <mat-icon matListItemIcon class="avatar-icon">account_circle</mat-icon>

            <div matListItemTitle class="user-name">{{ user.username }}</div>
            <div matListItemLine class="user-email">Usuario registrado</div>

            <button
              mat-flat-button
              color="primary"
              matListItemMeta
              (click)="invitar(user)"
              class="invite-btn"
            >
              Invitar
            </button>
          </mat-list-item>
        </mat-list>

        <div *ngIf="resultados.length === 0 && busco" class="empty-state">
          <mat-icon>person_off</mat-icon>
          <p>No encontramos usuarios con ese nombre.</p>
        </div>

        <div *ngIf="!busco" class="empty-state initial">
          <mat-icon>group_add</mat-icon>
          <p>Busca amigos para trabajar juntos.</p>
        </div>
      </div>
    </mat-dialog-content>
  `,
  styleUrl: './dialogo-colaboradores.css',
})
export class DialogoColaboradores {
  filtro = '';
  resultados: any[] = [];
  busco = false;

  constructor(
    private salasService: Salasservice,
    public dialogRef: MatDialogRef<DialogoColaboradores>,
    @Inject(MAT_DIALOG_DATA) public data: { salaId: string },
    private snackBar: MatSnackBar
  ) {}

  buscar() {
    if (!this.filtro.trim()) return;

    this.salasService.buscarUsuarios(this.filtro).subscribe({
      next: (res: any) => {
        this.resultados = res;
        this.busco = true;
      },
      error: () => this.mostrarNotificacion('Error buscando usuarios', '❌'),
    });
  }

  invitar(user: any) {
    this.salasService.agregarColaborador(this.data.salaId, user.username).subscribe({
      next: () => {
        this.mostrarNotificacion(`¡${user.username} invitado!`, '📩');
      },
      error: () => this.mostrarNotificacion('No se pudo invitar', '⚠️'),
    });
  }

  private mostrarNotificacion(mensaje: string, icono: string) {
    this.snackBar.open(`${icono} ${mensaje}`, 'OK', {
      duration: 3000,
      panelClass: ['glass-snackbar'],
    });
  }
}
