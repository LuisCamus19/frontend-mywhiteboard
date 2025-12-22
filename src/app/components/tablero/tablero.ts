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
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Trazo } from '../../models/trazo';

@Component({
  selector: 'app-tablero',
  imports: [CommonModule, FormsModule, MatSnackBarModule],
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

  private historialTrazos: Trazo[] = [];

  private timeoutGuardado: any;
  private subscriptions: Subscription = new Subscription();

  public salaId: string = '';
  public colorActual: string = '#000000';
  public grosor: number = 3;

  public cursoresRemotos: Map<string, any> = new Map();
  private miUsuario: string = '';

  private currentGrupoId: string = '';

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
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    this.resizeCanvas();

    // --- EVENTOS DE MOUSE ---
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseout', () => this.onMouseUp());

    // --- EVENTOS TÁCTILES (iPad) ---
    canvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'), { passive: false });
    canvas.addEventListener('touchend', () => this.onMouseUp(), { passive: false });

    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    if (this.salaId) this.reiniciarSala();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.timeoutGuardado) clearTimeout(this.timeoutGuardado);
  }

  private handleTouch(e: TouchEvent, tipo: 'start' | 'move') {
    if (!this.modoMover || (this.modoMover && this.arrastrando)) {
      e.preventDefault();
    }
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (tipo === 'start') {
        this.onMouseDown(touch as any);
      } else {
        this.onMouseMove(touch as any);
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    this.redibujarTodo();
  }

  reiniciarSala() {
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.historialTrazos = [];
    this.redibujarTodo();

    this.wsService.conectar(this.salaId);

    this.subscriptions.add(
      this.wsService.trazos$.subscribe((mensaje: any) => {
        if (!mensaje) return;

        if (mensaje.accion === 'BORRAR_TODO') {
          this.historialTrazos = [];
          this.redibujarTodo();
        } else if (mensaje.accion === 'RECARGAR') {
          this.historialTrazos = [];
          this.redibujarTodo();
          this.cargarHistorial();
        } else {
          this.historialTrazos.push(mensaje as Trazo);
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
    this.http.get<Trazo[]>(`${environment.apiUrl}/api/historial/${this.salaId}`).subscribe({
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
    const dpr = window.devicePixelRatio || 1;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.ctx.scale(dpr, dpr);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    this.historialTrazos.forEach((trazo) => {
      this.ctx.beginPath();

      const x0 = trazo.xInicial ?? trazo.x0 ?? 0;
      const y0 = trazo.yInicial ?? trazo.y0 ?? 0;
      const x1 = trazo.xFinal ?? trazo.x1 ?? 0;
      const y1 = trazo.yFinal ?? trazo.y1 ?? 0;

      this.ctx.moveTo(x0, y0);
      this.ctx.lineTo(x1, y1);
      this.ctx.strokeStyle = trazo.color;
      this.ctx.lineWidth = trazo.grosor;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    });
  }

  // --- INTERACCIÓN ---

  private onMouseDown(e: any) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.prevX = e.clientX - rect.left;
    this.prevY = e.clientY - rect.top;

    if (this.modoMover) {
      this.arrastrando = true;
      this.canvasRef.nativeElement.style.cursor = 'grabbing';
    } else {
      this.dibujando = true;
      this.currentGrupoId = crypto.randomUUID();
    }
  }

  private onMouseMove(e: any) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const xActual = e.clientX - rect.left;
    const yActual = e.clientY - rect.top;

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
      // Coordenadas locales calculadas
      const x0 = (this.prevX - this.offsetX) / this.scale;
      const y0 = (this.prevY - this.offsetY) / this.scale;
      const x1 = (xActual - this.offsetX) / this.scale;
      const y1 = (yActual - this.offsetY) / this.scale;

      const trazo: Trazo = {
        grupoId: this.currentGrupoId,
        usuario: this.miUsuario,
        color: this.colorActual,
        grosor: this.grosor,

        // --- Campos obligatorios nuevos ---
        visible: true,

        // --- Mapeo correcto de nombres ---
        xInicial: x0,
        yInicial: y0,
        xFinal: x1,
        yFinal: y1,

        salaId: this.salaId,
        paginaId: undefined, // En pizarra infinita es undefined o null
      };

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
    if (this.canvasRef) {
      this.canvasRef.nativeElement.style.cursor = this.modoMover ? 'grab' : 'crosshair';
    }
    this.guardarMiniaturaAutomatica();
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    this.aplicarZoom(delta, mouseX, mouseY);
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
    this.http
      .put(`${environment.apiUrl}/api/salas/${this.salaId}/imagen`, { imagen: imagenBase64 })
      .subscribe({ error: (err) => console.error(err) });
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

  deshacer() {
    this.wsService.enviarDeshacer(this.salaId, this.miUsuario);
  }

  rehacer() {
    this.wsService.enviarRehacer(this.salaId, this.miUsuario);
  }
}
