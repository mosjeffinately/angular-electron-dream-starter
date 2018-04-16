import { Component, NgZone, OnInit } from "@angular/core";
import { CourseData } from "../../model/model";

@Component({
    selector: 'main-app',
    templateUrl: './main-app.component.html',
})
export class MainComponent implements OnInit {
    constructor(private zone: NgZone) {}

    ngOnInit() {}
}
