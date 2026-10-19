import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

interface Metric {
  title: string;
  value: string;
  label: string;
  detail: string;
}

interface Category {
  icon: string;
  title: string;
  detail: string;
}

interface WorkflowStep {
  number: string;
  icon: string;
  title: string;
  detail: string;
  link: string;
}

@Component({
  selector: 'jhub-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly showLanding = signal(this.router.url === '/');

  constructor() {
    const subscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.showLanding.set(event.urlAfterRedirects === '/'));
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  readonly metrics: Metric[] = [
    { title: 'Asset inventory', value: '210+', label: 'Verified assets', detail: 'Physical and IoT instruments in custody.' },
    { title: 'Active cohorts', value: '14', label: 'Innovation hubs', detail: 'Regional university and lab nodes.' },
    { title: 'Deployment rate', value: '88%', label: 'Real-time utilization', detail: 'Assets actively supporting projects.' },
    { title: 'SLA guarantee', value: '< 24h', label: 'Custodial SLA', detail: 'Fast verification and handoff.' }
  ];

  readonly categories: Category[] = [
    { icon: 'pi pi-desktop', title: 'Computing peripherals', detail: 'Displays, boards and input devices.' },
    { icon: 'pi pi-share-alt', title: 'Networking infrastructure', detail: 'Switches, routers and connectivity.' },
    { icon: 'pi pi-microchip', title: 'IoT & prototyping', detail: 'Sensors, kits and embedded tools.' },
    { icon: 'pi pi-video', title: 'AV & presentation', detail: 'Projectors, cameras and audio.' },
    { icon: 'pi pi-briefcase', title: 'Office supplies', detail: 'Practical tools for project teams.' },
    { icon: 'pi pi-home', title: 'Furniture', detail: 'Workspaces, seating and fixtures.' }
  ];

  readonly workflow: WorkflowStep[] = [
    { number: '01', icon: 'pi pi-user', title: 'Browse & reserve', detail: 'Discover available components and reserve what your team needs.', link: 'View available inventory' },
    { number: '02', icon: 'pi pi-file-edit', title: 'Submit abstract', detail: 'Share your project abstract for identity and cohort verification.', link: 'Start a project request' },
    { number: '03', icon: 'pi pi-box', title: 'Lab dispatch', detail: 'Collect verified hardware with barcode and serial tracking.', link: 'Review the handoff flow' }
  ];
}
