import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'no-content',
  templateUrl: './no-content.component.html'
})
export class NoContentComponent implements OnInit {

  constructor(private router: Router, 
              private route: ActivatedRoute) {}

  ngOnInit() {
      console.debug('Router:', this.router);
      console.debug('Route:', this.route);
  }
}
