import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { WebSocketservice } from '../../services/web-socketservice';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Authservice } from '../../services/authservice';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tablero',
  imports: [CommonModule, FormsModule],
  templateUrl: './tablero.html',
  styleUrl: './tablero.css',
})
export class Tablero implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pizarra') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  private dibujando = false;
  private arrastrando = false;
  public modoMover = false;

  private prevX = 0;
  private prevY = 0;
  public offsetX = 0;
  public offsetY = 0;
  public scale = 1;

  private historialTrazos: any[] = [];
  private timeoutGuardado: any;
  private subscriptions: Subscription = new Subscription(); // Para manejar fugas de memoria

  public salaId: string = '';
  public colorActual: string = '#000000';
  public grosor: number = 3;

  public cursoresRemotos: Map<string, any> = new Map();
  private miUsuario: string = '';

  constructor(
    private wsService: WebSocketservice,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: Authservice
  ) {
    this.miUsuario = this.authService.getUsername();
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.salaId = params.get('id') || 'general';
      if (this.ctx) this.reiniciarSala();
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseout', () => this.onMouseUp());
    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    if (this.salaId) this.reiniciarSala();
  }

  ngOnDestroy() {
    // 🔥 Limpiamos las suscripciones para que no se sigan escuchando mensajes al salir
    this.subscriptions.unsubscribe();
    if (this.timeoutGuardado) clearTimeout(this.timeoutGuardado);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvasRef) return;
    this.canvasRef.nativeElement.width = window.innerWidth;
    this.canvasRef.nativeElement.height = window.innerHeight;
    this.redibujarTodo();
  }

  reiniciarSala() {
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.historialTrazos = [];
    this.redibujarTodo();

    this.wsService.conectar(this.salaId);

    // Guardamos las suscripciones para limpiarlas en ngOnDestroy
    this.subscriptions.add(
      this.wsService.trazos$.subscribe((mensaje: any) => {
        if (!mensaje) return;
        if (mensaje.accion === 'BORRAR_TODO') {
          this.historialTrazos = [];
          this.redibujarTodo();
        } else {
          this.historialTrazos.push(mensaje);
          this.redibujarTodo();
        }
      })
    );

    this.subscriptions.add(
      this.wsService.cursores$.subscribe((mensaje: any) => {
        if (!mensaje || mensaje.usuario === this.miUsuario) return;
        this.cursoresRemotos.set(mensaje.usuario, mensaje);
      })
    );

    this.cargarHistorial();
  }

  private cargarHistorial() {
    this.http.get<any[]>(`${environment.apiUrl}/api/historial/${this.salaId}`).subscribe({
      next: (lista) => {
        this.historialTrazos = lista;
        this.redibujarTodo();
      },
      error: (err) => console.error('Error historial', err),
    });
  }

  private redibujarTodo() {
    if (!this.ctx || !this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    this.historialTrazos.forEach((trazo) => {
      this.ctx.beginPath();
      const x0 = trazo.xInicial ?? trazo.x0;
      const y0 = trazo.yInicial ?? trazo.y0;
      const x1 = trazo.xFinal ?? trazo.x1;
      const y1 = trazo.yFinal ?? trazo.y1;

      this.ctx.moveTo(x0, y0);
      this.ctx.lineTo(x1, y1);
      this.ctx.strokeStyle = trazo.color;
      this.ctx.lineWidth = trazo.grosor;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    });
  }

  private onMouseDown(e: MouseEvent) {
    this.prevX = e.clientX;
    this.prevY = e.clientY;
    if (this.modoMover) {
      this.arrastrando = true;
      this.canvasRef.nativeElement.style.cursor = 'grabbing';
    } else {
      this.dibujando = true;
    }
  }

  private onMouseMove(e: MouseEvent) {
    const xActual = e.clientX;
    const yActual = e.clientY;

    const xMundo = (xActual - this.offsetX) / this.scale;
    const yMundo = (yActual - this.offsetY) / this.scale;

    this.wsService.enviarCursor(this.salaId, {
      usuario: this.miUsuario,
      x: xMundo,
      y: yMundo,
      color: this.colorActual,
    });

    if (this.modoMover && this.arrastrando) {
      this.offsetX += xActual - this.prevX;
      this.offsetY += yActual - this.prevY;
      this.redibujarTodo();
      this.prevX = xActual;
      this.prevY = yActual;
    } else if (!this.modoMover && this.dibujando) {
      const x0 = (this.prevX - this.offsetX) / this.scale;
      const y0 = (this.prevY - this.offsetY) / this.scale;
      const x1 = (xActual - this.offsetX) / this.scale;
      const y1 = (yActual - this.offsetY) / this.scale;

      const trazo = { x0, y0, x1, y1, color: this.colorActual, grosor: this.grosor };

      this.wsService.enviarTrazo(this.salaId, trazo);
      this.historialTrazos.push(trazo);
      this.redibujarTodo();
      this.prevX = xActual;
      this.prevY = yActual;
    }
  }

  private onMouseUp() {
    this.dibujando = false;
    this.arrastrando = false;
    this.canvasRef.nativeElement.style.cursor = this.modoMover ? 'grab' : 'crosshair';
    this.guardarMiniaturaAutomatica();
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this.aplicarZoom(delta, e.clientX, e.clientY);
  }

  cambiarZoom(delta: number) {
    this.aplicarZoom(delta, window.innerWidth / 2, window.innerHeight / 2);
  }

  private aplicarZoom(delta: number, pivotX: number, pivotY: number) {
    const oldScale = this.scale;
    const newScale = Math.min(Math.max(0.1, oldScale + delta), 5);
    const worldX = (pivotX - this.offsetX) / oldScale;
    const worldY = (pivotY - this.offsetY) / oldScale;
    this.offsetX = pivotX - worldX * newScale;
    this.offsetY = pivotY - worldY * newScale;
    this.scale = newScale;
    this.redibujarTodo();
  }

  irAlHome() {
    this.guardarMiniaturaAhora();
    this.router.navigate(['/dashboard']);
  }

  toggleModo(mover: boolean) {
    this.modoMover = mover;
    this.canvasRef.nativeElement.style.cursor = mover ? 'grab' : 'crosshair';
  }

  guardarMiniaturaAutomatica() {
    if (this.timeoutGuardado) clearTimeout(this.timeoutGuardado);
    this.timeoutGuardado = setTimeout(() => this.guardarMiniaturaAhora(), 2000);
  }

  guardarMiniaturaAhora() {
    if (!this.canvasRef || !this.salaId) return;
    const imagenBase64 = this.canvasRef.nativeElement.toDataURL('image/jpeg', 0.5);

    // 🔥 CORRECCIÓN: La ruta del Backend es /api/salas/{id}/imagen, NO /api/historial/...
    this.http
      .put(`${environment.apiUrl}/api/salas/${this.salaId}/imagen`, { imagen: imagenBase64 })
      .subscribe({
        error: (err) => console.error('Error al guardar miniatura:', err),
      });
  }

  activarBorrador() {
    this.modoMover = false;
    this.colorActual = '#ffffff';
    this.grosor = 20;
  }

  descargarImagen() {
    if (!this.canvasRef) return;
    const link = document.createElement('a');
    link.download = `pizarra-${Date.now()}.png`;
    link.href = this.canvasRef.nativeElement.toDataURL('image/png');
    link.click();
  }

  borrarTodo() {
    if (confirm('⚠️ ¿Borrar todo el contenido de la pizarra?')) {
      this.wsService.borrarPizarra(this.salaId).subscribe();
    }
  }
}
