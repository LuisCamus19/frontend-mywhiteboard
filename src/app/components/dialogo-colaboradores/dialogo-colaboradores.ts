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
    <h2 mat-dialog-title>🤝 Invitar a Colaborar</h2>

    <mat-dialog-content>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <mat-form-field appearance="outline" style="flex: 1;">
          <mat-label>Buscar usuario</mat-label>
          <input matInput [(ngModel)]="filtro" (keyup.enter)="buscar()" placeholder="Ej: luis" />
        </mat-form-field>
        <button mat-mini-fab color="primary" (click)="buscar()" style="margin-top: 8px;">
          <mat-icon>search</mat-icon>
        </button>
      </div>

      <mat-list>
        <div mat-subheader *ngIf="busco">Resultados</div>

        <mat-list-item
          *ngFor="let user of resultados"
          style="background: #f5f5f5; margin-bottom: 5px; border-radius: 8px;"
        >
          <mat-icon matListItemIcon>person</mat-icon>
          <div matListItemTitle>{{ user.username }}</div>
          <button mat-stroked-button color="accent" matListItemMeta (click)="invitar(user)">
            Invitar
          </button>
        </mat-list-item>

        <p
          *ngIf="resultados.length === 0 && busco"
          style="text-align: center; color: gray; margin-top: 10px;"
        >
          No se encontraron usuarios.
        </p>
      </mat-list>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styleUrl: './dialogo-colaboradores.css',
})
export class DialogoColaboradores {
  filtro = '';
  resultados: any[] = [];
  busco = false;

  constructor(
    private http: HttpClient,
    public dialogRef: MatDialogRef<DialogoColaboradores>,
    @Inject(MAT_DIALOG_DATA) public data: { salaId: string },
    private snackBar: MatSnackBar
  ) {}

  buscar() {
    if (!this.filtro.trim()) return;
    // ✅ CAMBIO: Usar environment.apiUrl
    this.http
      .get<any[]>(`${environment.apiUrl}/api/usuarios/buscar?filtro=${this.filtro}`)
      .subscribe({
        next: (res) => {
          this.resultados = res;
          this.busco = true;
        },
        error: () => this.snackBar.open('Error buscando usuarios', 'Cerrar'),
      });
  }

  invitar(user: any) {
    // ✅ CAMBIO: Usar environment.apiUrl
    this.http
      .post(`${environment.apiUrl}/api/salas/${this.data.salaId}/colaboradores`, {
        username: user.username,
      })
      .subscribe({
        next: () => {
          this.snackBar.open(`✅ ¡${user.username} ha sido invitado!`, 'Genial', {
            duration: 3000,
          });
        },
        error: () => this.snackBar.open('❌ Error al invitar', 'Cerrar'),
      });
  }
}
