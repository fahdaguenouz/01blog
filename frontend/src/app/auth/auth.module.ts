import { NgModule } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './signup/signup.component';

@NgModule({
  imports: [LoginComponent, SignUpComponent],
  exports: [LoginComponent, SignUpComponent],
})
export class AuthModule {}
