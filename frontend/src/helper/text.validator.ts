import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";




export function notBlank(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value ?? '').toString();
    return v.trim().length > 0 ? null : { blank: true };
  };
}


export function noHtmlTags(): ValidatorFn {
  const tagRe = /<[^>]*>/g; // simple tag detector
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value ?? '').toString();
    return tagRe.test(v) ? { html: true } : null;
  };
}