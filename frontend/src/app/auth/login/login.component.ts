import { Component } from '@angular/core';
import { FormControl, FormGroup, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DefaultLoginLayoutComponent } from '../components/default-login-layout/default-login-layout.component';
import { PrimaryInputComponent } from '../components/primary-input/primary-input.component';
import { LoginService } from '../services/login.service';
import { ToastrService } from 'ngx-toastr';

interface LoginForm {
  username: FormControl,
  password: FormControl
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    DefaultLoginLayoutComponent,
    ReactiveFormsModule,
    PrimaryInputComponent
  ],
  providers: [
    LoginService
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm!: FormGroup<LoginForm>;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastService: ToastrService
  ){
    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    })
  }

  submit(){
    this.loginService.login(this.loginForm.value.username, this.loginForm.value.password).subscribe({
      next: () => {
        this.toastService.success("Logged in successfully");
        this.router.navigate(["/feed"]);
      },
      error: () => this.toastService.error("Erro inesperado! Tente novamente mais tarde")
    })
  }

  navigate(){
    this.router.navigate(["auth/signup"]) 
  }
}
