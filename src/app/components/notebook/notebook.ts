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

  cuadernoId!: number;
  cuaderno?: Cuaderno;
  paginas: Pagina[] = [];

  // Paginación
  idxPagina: number = 0;
  paginaActual!: Pagina;
  trazosPagina: Trazo[] = [];

  // --- HERRAMIENTAS Y ESTADO ---
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
      // Es vital que redibujar() use this.paginaActual.estiloFondo
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
    if (h === 'RESALTADOR') {
      this.grosor = 15;
    } else if (h === 'LAPIZ') {
      this.grosor = 3;
    } else if (h === 'GOMA') {
      this.grosor = 20;
    }
  }

  // --- LÓGICA DE DIBUJO ---

  redibujar() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.dibujarFondo(this.paginaActual?.estiloFondo || Estilo.BLANCO, canvas.width, canvas.height);

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.trazosPagina.forEach((t) => {
      this.ctx.beginPath();
      this.ctx.strokeStyle = t.color;
      this.ctx.lineWidth = t.grosor;

      // Ajuste visual para resaltador
      if (t.color.length > 7) {
        this.ctx.globalCompositeOperation = 'multiply';
      } else {
        this.ctx.globalCompositeOperation = 'source-over';
      }

      const x0 = t.xInicial ?? 0;
      const y0 = t.yInicial ?? 0;
      const x1 = t.xFinal ?? 0;
      const y1 = t.yFinal ?? 0;

      this.ctx.moveTo(x0, y0);
      this.ctx.lineTo(x1, y1);
      this.ctx.stroke();
    });
  }

  dibujarFondo(estilo: any, w: number, h: number) {
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.fillStyle = '#e0e0e0'; // Necesario para los puntos
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    // Convertimos a string por seguridad si viene como Enum
    const estiloStr = estilo?.toString();

    if (estiloStr === 'RAYADO') {
      for (let y = 50; y < h; y += 30) {
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(w, y);
      }
      this.ctx.stroke();
    } else if (estiloStr === 'CUADRICULADO') {
      for (let x = 0; x < w; x += 25) {
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += 25) {
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(w, y);
      }
      this.ctx.stroke();
    } else if (estiloStr === 'PUNTOS') {
      const espacio = 25; // Distancia entre puntos
      for (let x = espacio; x < w; x += espacio) {
        for (let y = espacio; y < h; y += espacio) {
          this.ctx.moveTo(x, y);
          // Dibujamos un mini círculo de 1px de radio
          this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        }
      }
      this.ctx.fill(); // Rellenamos los puntos
    }
  }

  setupEventosCanvas() {
    const c = this.canvasRef.nativeElement;
    c.addEventListener('mousedown', (e) => this.start(e.offsetX, e.offsetY));
    c.addEventListener('mousemove', (e) => this.move(e.offsetX, e.offsetY));
    c.addEventListener('mouseup', () => this.end());
    c.addEventListener('mouseout', () => this.end());

    c.addEventListener(
      'touchstart',
      (e) => {
        if (e.cancelable) e.preventDefault();
        const r = c.getBoundingClientRect();
        this.start(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
      },
      { passive: false }
    );

    c.addEventListener(
      'touchmove',
      (e) => {
        if (e.cancelable) e.preventDefault();
        const r = c.getBoundingClientRect();
        this.move(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
      },
      { passive: false }
    );

    c.addEventListener('touchend', () => this.end());
  }

  start(x: number, y: number) {
    this.dibujando = true;
    this.prevX = x;
    this.prevY = y;

    this.currentGrupoId = crypto.randomUUID();
  }

  move(x: number, y: number) {
    if (!this.dibujando) return;

    let colorFinal = this.colorSeleccionado;

    if (this.herramientaActual === 'GOMA') {
      colorFinal = '#ffffff';
    } else if (this.herramientaActual === 'RESALTADOR') {
      if (colorFinal.length === 7) colorFinal += '50';
    }

    // Dibujo visual rápido
    this.ctx.beginPath();
    this.ctx.strokeStyle = colorFinal;
    this.ctx.lineWidth = this.grosor;
    if (colorFinal.length > 7) {
      this.ctx.globalCompositeOperation = 'multiply';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }
    this.ctx.moveTo(this.prevX, this.prevY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

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
