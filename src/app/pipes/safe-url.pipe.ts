import { Pipe } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
@Pipe({ name: 'safeUrl'})
export class SafeUrlPipe { 
constructor(private sanitized: DomSanitizer) {}
 transform(value) {
    return this.sanitized.bypassSecurityTrustUrl(value);
  }

}