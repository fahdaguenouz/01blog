import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PrimaryInputComponent } from '../components/primary-input/primary-input.component';
import { DefaultLoginLayoutComponent } from '../components/default-login-layout/default-login-layout.component';
import { LoginService } from '../services/login.service';
import { ToastrService } from 'ngx-toastr';
interface SignupForm {
  username: FormControl,
  email: FormControl,
  password: FormControl,
  passwordConfirm: FormControl
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    DefaultLoginLayoutComponent,
    ReactiveFormsModule,
    PrimaryInputComponent
  ],
  providers: [
    LoginService
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignUpComponent {
  signupForm!: FormGroup<SignupForm>;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastService: ToastrService
  ){
    this.signupForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      passwordConfirm: new FormControl('', [Validators.required, Validators.minLength(6)]),
    })
  }

  submit(){
    if(this.signupForm.value.password !== this.signupForm.value.passwordConfirm){
      this.toastService.error("Passwords do not match");
      return;
    }
    this.loginService.signup(this.signupForm.value.username, this.signupForm.value.email, this.signupForm.value.password).subscribe({
      next: () => {
        this.toastService.success("Account created. Please log in.");
        this.router.navigate(["/auth/login"]);
      },
      error: () => this.toastService.error("Erro inesperado! Tente novamente mais tarde")
    })
  }

  navigate(){
    this.router.navigate(["auth/login"])
  }
}
