import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-default-login-layout',
  standalone: true,
  templateUrl: './default-login-layout.component.html',
  styleUrls: ['./default-login-layout.component.scss']
})
export class DefaultLoginLayoutComponent {
  @Input() title = '';
}
