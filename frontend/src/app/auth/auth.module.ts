import { NgModule } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

@NgModule({
  imports: [LoginComponent, RegisterComponent],
  exports: [LoginComponent, RegisterComponent],
})
export class AuthModule {}
