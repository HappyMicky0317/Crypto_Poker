import { inject } from 'aurelia-framework';

@inject(Element)
export class VisibilityCustomAttribute {
  constructor(private element:HTMLElement) {
    this.element = element;
  }

  valueChanged(newValue) {
    this.element.style.visibility = newValue ? 'visible' : 'hidden';
  }
}
