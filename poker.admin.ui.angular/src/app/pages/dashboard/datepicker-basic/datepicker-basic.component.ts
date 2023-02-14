import { Component, OnInit, Input } from '@angular/core';
import {NgbDateStruct, NgbCalendar} from '@ng-bootstrap/ng-bootstrap';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'datepicker-basic',
  templateUrl: './datepicker-basic.component.html',
  styles: [`button.calendar,button.calendar:active {
    width: 2.75rem;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAcCAYAAAAEN20fAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEUSURBVEiJ7ZQxToVAEIY/YCHGxN6XGOIpnpaEsBSeQC9ArZbm9TZ6ADyBNzAhQGGl8Riv4BLAWAgmkpBYkH1b8FWT2WK/zJ8ZJ4qiI6XUI3ANnGKWBnht2/ZBDRK3hgVGNsCd7/ui+JkEIrKtqurLpEWaphd933+IyI3LEIdpCYCiKD6HcuOa/nwOa0ScJEnk0BJg0UTUWJRl6RxCYEzEmomsIlPU3IPW+grIAbquy+q6fluy/28RIBeRMwDXdXMgXLj/B2uimRXpui4D9sBeRLKl+1N+L+t6RwbWrZliTTTr1oxYtzVWiTQAcRxvTX+eJMnlUDaO1vpZRO5NS0x48sIwfPc87xg4B04MCzQi8hIEwe4bl1DnFMCN2zsAAAAASUVORK5CYII=)!important;
    background-repeat: no-repeat;
    background-size: 23px;
    background-position: center;
}

.btn-outline-secondary {
  color: #6c757d;
  background-color: transparent;
  background-image: none;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d
}
.btn-link{
  color:#007bff !important;
}

`]
})
export class DatepickerBasicComponent implements OnInit {


  model: NgbDateStruct;

  
  
  //date: {year: number, month: number};
  //time = {hour: 13, minute: 30};
  @Input('group') group:FormGroup;
  @Input('formControlNameDate') formControlNameDate:string;
  @Input('formControlNameTime') formControlNameTime:string;

  constructor(private calendar: NgbCalendar) {
    
  }

  selectToday() {
    this.model = this.calendar.getToday();
  }

  ngOnInit() {
     //console.log('formControlNameTime', this.formControlNameTime);
    
  }

}


/*
import {Component} from '@angular/core';
import {NgbDateStruct, NgbCalendar} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-datepicker-basic',
  templateUrl: './datepicker-basic.component.html'
})
export class DatepickerBasicComponent {


}

*/
