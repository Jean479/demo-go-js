import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DiagramService {
  dragged = null;

  myDiagram = null;
  constructor() { }
}
