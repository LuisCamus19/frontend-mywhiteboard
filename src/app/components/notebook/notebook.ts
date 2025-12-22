import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Trazo } from '../../models/trazo';
import { Estilo } from '../../models/enums';
import { Cuaderno, Pagina } from '../../models/filesystem';
import { ActivatedRoute, Router } from '@angular/router';
import { Pageservice } from '../../services/pageservice';
import { Notebookservice } from '../../services/notebookservice';
import { WebSocketservice } from '../../services/web-socketservice';
import { Authservice } from '../../services/authservice';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { jsPDF } from 'jspdf';

// Tipos de herramientas disponibles
type Herramienta = 'LAPIZ' | 'RESALTADOR' | 'GOMA';

@Component({
  selector: 'app-notebook',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSliderModule,
    MatTooltipModule,
  ],
  templateUrl: './notebook.html',
  styleUrl: './notebook.css',
})
export class Notebook implements OnInit, AfterViewInit {
  @ViewChild('hojaCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  private initialPinchDistance: number = 0;
  private initialScale: number = 0;

  escala: number = 0.8;
  cuadernoId!: number;
  cuaderno?: Cuaderno;
  paginas: Pagina[] = [];
  idxPagina: number = 0;
  paginaActual!: Pagina;
  trazosPagina: Trazo[] = [];

  herramientaActual: Herramienta = 'LAPIZ';
  dibujando = false;
  colorSeleccionado = '#000000';
  grosor = 3;

  private prevX = 0;
  private prevY = 0;
  private miUsuario = '';
  private currentGrupoId: string = '';
  private subs: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pageService: Pageservice,
    private notebookService: Notebookservice,
    private wsService: WebSocketservice,
    private authService: Authservice
  ) {
    this.miUsuario = this.authService.getUsername();
  }

  getStylesFondo() {
    const estilo = this.paginaActual?.estiloFondo;
    if (estilo === 'CUADRICULADO') {
      return {
        'background-image':
          'linear-gradient(#e0e0e0 1px, transparent 1px), linear-gradient(90deg, #e0e0e0 1px, transparent 1px)',
        'background-size': '25px 25px',
      };
    }
    if (estilo === 'RAYADO') {
      return {
        'background-image': 'linear-gradient(#e0e0e0 1px, transparent 1px)',
        'background-size': '100% 30px',
      };
    }
    if (estilo === 'PUNTOS') {
      return {
        'background-image': 'radial-gradient(#e0e0e0 1px, transparent 1px)',
        'background-size': '25px 25px',
      };
    }
    return { 'background-color': '#ffffff' };
  }

  ajustarZoom(delta: number) {
    const nuevaEscala = this.escala + delta;
    if (nuevaEscala >= 0.2 && nuevaEscala <= 3) {
      this.escala = nuevaEscala;
    }
  }

  private getCoords(clientX: number, clientY: number) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  ngOnInit() {
    this.route.paramMap.subscribe((p) => {
      this.cuadernoId = Number(p.get('id'));
      this.cargarTodo();
      const canalSocket = 'cuaderno-' + this.cuadernoId;
      this.wsService.conectar(canalSocket);
      this.subs.add(
        this.wsService.trazos$.subscribe((trazo: Trazo) => {
          if (trazo.paginaId === this.paginaActual?.id && trazo.usuario !== this.miUsuario) {
            this.trazosPagina.push(trazo);
            this.redibujar();
          }
        })
      );
    });
  }

  ngAfterViewInit() {
    if (this.canvasRef) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d', { willReadFrequently: true })!;
      this.setupEventosCanvas();
    }
  }

  ngOnDestroy() {
    this.wsService.desconectar();
    this.subs.unsubscribe();
  }

  cargarTodo() {
    this.notebookService.getById(this.cuadernoId).subscribe((c) => (this.cuaderno = c));
    this.pageService.getByNotebook(this.cuadernoId).subscribe((list) => {
      this.paginas = list;
      if (list.length > 0) this.irAPagina(0);
    });
  }

  irAPagina(index: number) {
    if (index < 0 || index >= this.paginas.length) return;
    this.idxPagina = index;
    this.paginaActual = this.paginas[index];
    this.trazosPagina = [];
    setTimeout(() => {
      this.redibujar();
      this.cargarTrazosDePagina();
    }, 10);
  }

  cargarTrazosDePagina() {
    this.pageService.getTrazosByPagina(this.paginaActual.id).subscribe({
      next: (trazos) => {
        this.trazosPagina = trazos;
        this.redibujar();
      },
      error: (err) => console.error('Error cargando trazos', err),
    });
  }

  nuevaPagina() {
    const estiloHeredado = this.paginaActual.estiloFondo || Estilo.BLANCO;
    this.pageService.create(this.cuadernoId, estiloHeredado).subscribe((p) => {
      this.paginas.push(p);
      this.irAPagina(this.paginas.length - 1);
    });
  }

  seleccionarHerramienta(h: Herramienta) {
    this.herramientaActual = h;
    if (h === 'RESALTADOR') this.grosor = 15;
    else if (h === 'LAPIZ') this.grosor = 3;
    else if (h === 'GOMA') this.grosor = 20;
  }

  redibujar() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const esA3 = this.cuaderno?.formato === 'A3';
    canvas.width = esA3 ? 1131 : 800;
    canvas.height = esA3 ? 1600 : 1131;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.trazosPagina.forEach((t) => {
      this.ctx.beginPath();
      this.ctx.lineWidth = t.grosor;
      if (t.color === 'GOMA') {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        this.ctx.globalCompositeOperation = t.color.length > 7 ? 'multiply' : 'source-over';
        this.ctx.strokeStyle = t.color;
      }
      this.ctx.moveTo(t.xInicial ?? 0, t.yInicial ?? 0);
      this.ctx.lineTo(t.xFinal ?? 0, t.yFinal ?? 0);
      this.ctx.stroke();
      this.ctx.globalCompositeOperation = 'source-over';
    });
  }

  async exportarAPDF() {
    if (!this.paginas || this.paginas.length === 0) return;
    const esA3 = this.cuaderno?.formato === 'A3';
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: esA3 ? 'a3' : 'a4',
    });
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = this.canvasRef.nativeElement.width;
    tempCanvas.height = this.canvasRef.nativeElement.height;

    for (let i = 0; i < this.paginas.length; i++) {
      const pagina = this.paginas[i];
      const trazos = (await this.pageService.getTrazosByPagina(pagina.id).toPromise()) || [];
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      this.dibujarFondoEnContexto(tempCtx, pagina.estiloFondo, tempCanvas.width, tempCanvas.height);
      tempCtx.lineCap = 'round';
      tempCtx.lineJoin = 'round';
      trazos.forEach((t) => {
        tempCtx.beginPath();
        tempCtx.strokeStyle = t.color;
        tempCtx.lineWidth = t.grosor;
        tempCtx.globalCompositeOperation = t.color.length > 7 ? 'multiply' : 'source-over';
        tempCtx.moveTo(t.xInicial ?? 0, t.yInicial ?? 0);
        tempCtx.lineTo(t.xFinal ?? 0, t.yFinal ?? 0);
        tempCtx.stroke();
      });
      const imgData = tempCanvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    doc.save(`Cuaderno_${this.cuaderno?.nombre || 'export'}.pdf`);
  }

  private dibujarFondoEnContexto(ctx: CanvasRenderingContext2D, estilo: any, w: number, h: number) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.fillStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const estiloStr = estilo?.toString();
    if (estiloStr === 'RAYADO') {
      for (let y = 50; y < h; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    } else if (estiloStr === 'CUADRICULADO') {
      for (let x = 0; x < w; x += 25) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += 25) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    } else if (estiloStr === 'PUNTOS') {
      for (let x = 25; x < w; x += 25) {
        for (let y = 25; y < h; y += 25) {
          ctx.moveTo(x, y);
          ctx.arc(x, y, 1, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }
  }

  setupEventosCanvas() {
    const c = this.canvasRef.nativeElement;

    // --- 1. DIBUJO PROFESIONAL CON BLOQUEO DE CAPTURA ---
    c.addEventListener('pointerdown', (e: PointerEvent) => {
      // Solo iniciamos dibujo si es Lápiz o Mouse
      if (e.pointerType === 'pen' || (e.pointerType === 'mouse' && e.button === 0)) {
        // 🔥 CLAVE 1: Capturamos el puntero para que el iPad no nos "robe" el gesto
        // Esto obliga a que todos los eventos sigan llegando al canvas hasta que sueltes.
        c.setPointerCapture(e.pointerId);

        this.start(e.clientX, e.clientY);

        // 🔥 CLAVE 2: Bloqueamos la acción por defecto del sistema inmediatamente
        if (e.cancelable) e.preventDefault();
      }
    });

    c.addEventListener('pointermove', (e: PointerEvent) => {
      if (this.dibujando && (e.pointerType === 'pen' || e.pointerType === 'mouse')) {
        // Bloqueamos scroll mientras el lápiz se mueve
        if (e.cancelable) e.preventDefault();
        this.move(e.clientX, e.clientY);
      }
    });

    c.addEventListener('pointerup', (e: PointerEvent) => {
      if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        // 🔥 CLAVE 3: Liberamos el puntero al terminar
        c.releasePointerCapture(e.pointerId);
        this.end();
      }
    });

    // Este evento es el que te está dando problemas actualmente (el iPad cancela el dibujo)
    c.addEventListener('pointercancel', (e: PointerEvent) => {
      if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        c.releasePointerCapture(e.pointerId);
        this.end();
      }
    });

    // --- 2. ZOOM CON RUEDA (Ctrl + Mouse) ---
    c.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.05 : 0.05;
          this.ajustarZoom(delta);
        }
      },
      { passive: false }
    );

    // --- 3. MULTITOUCH (Pinch Zoom con 2 dedos) ---
    c.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length === 2) {
          if (e.cancelable) e.preventDefault();
          this.initialPinchDistance = this.getDistance(e.touches);
          this.initialScale = this.escala;
        }
      },
      { passive: false }
    );

    c.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (e.touches.length === 2) {
          if (e.cancelable) e.preventDefault();
          const currentDistance = this.getDistance(e.touches);
          const zoomFactor = currentDistance / this.initialPinchDistance;
          const nuevaEscala = this.initialScale * zoomFactor;
          if (nuevaEscala >= 0.2 && nuevaEscala <= 3) {
            this.escala = nuevaEscala;
          }
        }
      },
      { passive: false }
    );

    c.addEventListener('touchend', () => {
      this.initialPinchDistance = 0;
    });

    // --- 4. BLOQUEOS DE SISTEMA ---
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Función auxiliar matemática para calcular distancia entre dos puntos
  private getDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  start(clientX: number, clientY: number) {
    const coords = this.getCoords(clientX, clientY);
    this.dibujando = true;
    this.prevX = coords.x;
    this.prevY = coords.y;
    this.currentGrupoId = crypto.randomUUID();
  }

  move(clientX: number, clientY: number) {
    if (!this.dibujando) return;
    const coords = this.getCoords(clientX, clientY);
    const x = coords.x;
    const y = coords.y;

    let colorFinal = this.colorSeleccionado;
    if (this.herramientaActual === 'GOMA') {
      colorFinal = 'GOMA';
      this.ctx.globalCompositeOperation = 'destination-out';
    } else if (this.herramientaActual === 'RESALTADOR') {
      if (colorFinal.length === 7) colorFinal += '50';
      this.ctx.globalCompositeOperation = 'multiply';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }

    this.ctx.beginPath();
    this.ctx.strokeStyle = colorFinal === 'GOMA' ? 'rgba(0,0,0,1)' : colorFinal;
    this.ctx.lineWidth = this.grosor;
    this.ctx.moveTo(this.prevX, this.prevY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.globalCompositeOperation = 'source-over';

    const nuevoTrazo: Trazo = {
      grupoId: this.currentGrupoId,
      usuario: this.miUsuario,
      color: colorFinal,
      grosor: this.grosor,
      visible: true,
      xInicial: this.prevX,
      yInicial: this.prevY,
      xFinal: x,
      yFinal: y,
      paginaId: this.paginaActual.id,
    };
    this.trazosPagina.push(nuevoTrazo);
    this.wsService.enviarTrazo('cuaderno-' + this.cuadernoId, nuevoTrazo);
    this.prevX = x;
    this.prevY = y;
  }

  end() {
    this.dibujando = false;
  }
  deshacer() {
    if (this.trazosPagina.length === 0) return;
    const ultimoTrazo = this.trazosPagina[this.trazosPagina.length - 1];
    const grupoABorrar = ultimoTrazo.grupoId;
    if (!grupoABorrar) return;
    this.trazosPagina = this.trazosPagina.filter((t) => t.grupoId !== grupoABorrar);
    this.redibujar();
  }
  salir() {
    this.router.navigate(['/dashboard']);
  }
}
