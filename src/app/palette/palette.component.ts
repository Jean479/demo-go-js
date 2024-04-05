import { Component, OnInit } from '@angular/core';
import { DiagramService } from '../diagram.service';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss']
})
export class PaletteComponent implements OnInit {

  constructor(private diagramService: DiagramService) {}

  ngOnInit(): void {
    this.diagramService.dragged = null; // A reference to the element currently being dragged
    document.addEventListener("dragstart", (event: any) => {
      if (event.target.className !== "draggable") return;
      // Some data must be set to allow drag
      event.dataTransfer.setData("text", event.target.textContent);
  
      // store a reference to the dragged element and the offset of the mouse from the center of the element
    }, false);


      // This event resets styles after a drag has completed (successfully or not)
    document.addEventListener("dragend", event => {
      // reset the border of the dragged element
      this.diagramService.dragged.style.border = "";
      this.onHighlight(null);
    }, false);



  }

  // this is called on a stationary node or link during an external drag-and-drop into a Diagram
  onHighlight(part) {  // may be null
    const myDiagram = this.diagramService.myDiagram;
    const oldskips = myDiagram.skipsUndoManager;
    myDiagram.skipsUndoManager = true;
    myDiagram.startTransaction("highlight");
    if (part !== null) {
      myDiagram.highlight(part);
    } else {
      myDiagram.clearHighlighteds();
    }
    myDiagram.commitTransaction("highlight");
    myDiagram.skipsUndoManager = oldskips;
  }

}
