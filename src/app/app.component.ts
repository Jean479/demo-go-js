/**
 * Sample app showcasing gojs-angular components
 * For use with gojs-angular version 2.x
 */

import { ChangeDetectorRef, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import * as go from 'gojs';
import { DataSyncService, DiagramComponent, PaletteComponent } from 'gojs-angular';
import produce from "immer";
import { DiagramService } from './diagram.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {

  @ViewChild('myDiagram', { static: true }) public myDiagramComponent!: DiagramComponent;
  @ViewChild('myPalette', { static: true }) public myPaletteComponent!: PaletteComponent;

  // Big object that holds app-level state data
  // As of gojs-angular 2.0, immutability is expected and required of state for ease of change detection.
  // Whenever updating state, immutability must be preserved. It is recommended to use immer for this, a small package that makes working with immutable data easy.
  public state = {
    // Diagram state props
    diagramNodeData: [
      { id: 'Alpha', text: "Alpha", color: 'lightblue', loc: "0 0" },
      { id: 'Beta', text: "Beta", color: 'orange', loc: "100 0" },
      { id: 'Gamma', text: "Gamma", color: 'lightgreen', loc: "0 100" },
      { id: 'Delta', text: "Delta", color: 'pink', loc: "100 100" }
    ],
    diagramLinkData: [
        { key: -1, from: 'Alpha', to: 'Beta', fromPort: 'r', toPort: '1' },
        { key: -2, from: 'Alpha', to: 'Gamma', fromPort: 'b', toPort: 't' },
        { key: -3, from: 'Beta', to: 'Beta' },
        { key: -4, from: 'Gamma', to: 'Delta', fromPort: 'r', toPort: 'l' },
        { key: -5, from: 'Delta', to: 'Alpha', fromPort: 't', toPort: 'r' }
    ],
    diagramModelData: { prop: 'value' },
    skipsDiagramUpdate: false,
    selectedNodeData: null, // used by InspectorComponent

    // Palette state props
    paletteNodeData: [
      { key: 'Epsilon', text: 'Epsilon', color: 'red' },
      { key: 'Kappa', text: 'Kappa', color: 'purple' }
    ],
    paletteModelData: { prop: 'val' }
  };
  
  public diagramDivClassName: string = 'myDiagramDiv';
  public paletteDivClassName = 'myPaletteDiv';

  // this is called upon an external drop in this diagram,
  // after a new node has been created and selected
  onDrop(newNode, point) {
    const myDiagram = this.myDiagramComponent.diagram;

    // look for a drop directly onto a Node or Link
    const it = myDiagram.findPartsAt(point).iterator;
    while (it.next()) {
      const part = it.value;
      if (part === newNode) continue;
      // the drop happened on some Part -- call its mouseDrop handler
      if (part && part.mouseDrop) {
        const e = new go.InputEvent();
        e.diagram = myDiagram;
        e.documentPoint = point;
        e.viewPoint = myDiagram.transformDocToView(point);
        e.up = true;
        myDiagram.lastInput = e;
        // should be running in a transaction already
        part.mouseDrop(e, part);
        return;
      }
    }
    // didn't find anything to drop onto
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
 
  attachListener() {
   // const div = this.myDiagramComponent.diagramDiv.nativeElement;
    document.addEventListener("dragstart", (event: any) => {
      if (event.target.className !== "draggable") return;
      console.log(' ici et la');
      this.diagramService.dragged = event.target;      
      this.diagramService.dragged.offsetX = event.offsetX - this.diagramService.dragged.clientWidth / 2;
      this.diagramService.dragged.offsetY = event.offsetY - this.diagramService.dragged.clientHeight / 2;
      // Objects during drag will have a red border
      event.target.style.border = "2px solid red";
    });
 
    document.addEventListener("dragenter", event => {
      // Here you could also set effects on the Diagram,
      // such as changing the background color to indicate an acceptable drop zone
  
      // Requirement in some browsers, such as Internet Explorer
      console.log(' ciiiii');
      
      event.preventDefault();
    }, false);

    document.addEventListener("dragover", event => {
      console.log(' event draggover');
      const myDiagram = this.diagramService.myDiagram;
      const can = event.target;
      const pixelratio = myDiagram.computePixelRatio();

      // if the target is not the canvas, we may have trouble, so just quit:
      if (!(can instanceof HTMLCanvasElement)) return;

      const bbox = can.getBoundingClientRect();
      let bbw = bbox.width;
      if (bbw === 0) bbw = 0.001;
      let bbh = bbox.height;
      if (bbh === 0) bbh = 0.001;
      const mx = event.clientX - bbox.left * ((can.width / pixelratio) / bbw);
      const my = event.clientY - bbox.top * ((can.height / pixelratio) / bbh);
      const point = myDiagram.transformViewToDoc(new go.Point(mx, my));
      const part = myDiagram.findPartAt(point, true);
      this.onHighlight(part);
      //@ts-ignore
      if (event.target.className === "dropzone") {
        console.log(' drop zone');
        
        // Disallow a drop by returning before a call to preventDefault:
        return;
      }

      event.preventDefault();
    }, false);

    document.addEventListener("drop", event => {
      // const myDiv = this.myDiagramComponent.diagramDiv.nativeElement;
      const myDiagram = this.myDiagramComponent.diagram;
      console.log(' drop: ', myDiagram.div);
      
      // prevent default action
      // (open as link for some elements in some browsers)
      event.preventDefault();
  
      // Dragging onto a Diagram
      //if (div === myDiv.div)
         {
        console.log(' laaaaaa:', event.target);
        console.log(' laaaaaa:', this.diagramService.dragged.offsetX);
        const can = event.target;
        
        const pixelratio = myDiagram.computePixelRatio();
  
        // if the target is not the canvas, we may have trouble, so just quit:
        if (!(can instanceof HTMLCanvasElement)) return;
  
        const bbox = can.getBoundingClientRect();
        let bbw = bbox.width;
        if (bbw === 0) bbw = 0.001;
        let bbh = bbox.height;
        if (bbh === 0) bbh = 0.001;
        const mx = event.clientX - bbox.left * ((can.width / pixelratio) / bbw);
        const my = event.clientY - bbox.top * ((can.height / pixelratio) / bbh);
        const point = myDiagram.transformViewToDoc(new go.Point(mx, my));
        console.log('point:', point);
        
        // // if there's nothing at that point
        // if (myDiagram.findPartAt(point) === null) {
        //   // a return here doesn't allow the drop to happen
        //   return;
        // }
        // otherwise create a new node at the drop point 
        myDiagram.startTransaction('new node');
        const newdata = {
          // assuming the locationSpot is Spot.Center:
          location: myDiagram.transformViewToDoc(new go.Point(mx - this.diagramService.dragged.offsetX, my - this.diagramService.dragged.offsetY)),
          text: event.dataTransfer.getData('text'),
          color: "lightyellow"
        };
        myDiagram.model.addNodeData(newdata);
        const newnode = myDiagram.findNodeForData(newdata);
        if (newnode) {
          newnode.ensureBounds();
          myDiagram.select(newnode);
          this.onDrop(newnode, point);
        }
        myDiagram.commitTransaction('new node');
  
        // remove dragged element from its old location, if checkbox is checked
        //if (document.getElementById('removeCheckBox').checked) dragged.parentNode.removeChild(dragged);
      }
  
      // If we were using drag data, we could get it here, ie:
      // const data = event.dataTransfer.getData('text');
    }, false);
  
  }
  // Decide whether a link from node1 to node2 may be created by a drop operation
  public mayConnect(node1, node2) {
    return node1 !== node2;
  }

  inv() {
    const diag = this.diagramService.myDiagram as go.Diagram;
    diag.layout.isOngoing = false;
    //diag.layout.invalidateLayout();
    //diag.layout.isOngoing = false;
  }

  // initialize diagram / templates
  public initDiagram(): go.Diagram {

    const $ = go.GraphObject.make;
    const dia = $(go.Diagram, {
      //layout: $(go.TreeLayout),
      
      //layout: $(go.ForceDirectedLayout),
      layout: new go.TreeLayout({ angle: 90, layerSpacing: 35 }),
      'undoManager.isEnabled': true,
      'clickCreatingTool.archetypeNodeData': { text: 'new node', color: 'lightblue' },
      model: $(go.GraphLinksModel,
        {
          nodeKeyProperty: 'id',
          linkToPortIdProperty: 'toPort',
          linkFromPortIdProperty: 'fromPort',
          linkKeyProperty: 'key' // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
        }
      )
    });

    dia.commandHandler.archetypeGroupData = { key: 'Group', isGroup: true };

    const makePort = function(id: string, spot: go.Spot) {
      return $(go.Shape, 'Circle',
        {
          opacity: .5,
          fill: 'gray', strokeWidth: 0, desiredSize: new go.Size(8, 8),
          portId: id, alignment: spot,
          fromLinkable: true, toLinkable: true
        }
      );
    }

    dia.linkTemplate =
    $(go.Link,
      // two path Shapes: the transparent one becomes visible during mouse-over
      $(go.Shape, { isPanelMain: true, strokeWidth: 6, stroke: "transparent" },
        new go.Binding("stroke", "isHighlighted", h => h ? "red" : "transparent").ofObject()),
      $(go.Shape, { isPanelMain: true, strokeWidth: 1 }),
      $(go.Shape, { toArrow: "Standard" }),
      { // on mouse-over, highlight the link
        //@ts-ignore
        mouseDragEnter: (e, link) => link.isHighlighted = true,
        //@ts-ignore
        mouseDragLeave: (e, link) => link.isHighlighted = false,
        // on a mouse-drop splice the new node in between the dropped-upon link's fromNode and toNode
        mouseDrop: (e, link: any) => {
          const oldto = link.toNode;
          const newnode = e.diagram.selection.first();
          if (! (newnode !== oldto)) return;
          if (! (link.fromNode !== newnode)) return;
          link.toNode = newnode;
        //@ts-ignore
          e.diagram.model.addLinkData({ from: newnode.key, to: oldto.key });
        }
      }
    );

    // define the Node template
    dia.nodeTemplate =
      $(go.Node, 'Spot',
      { locationSpot: go.Spot.Center },
      { // on mouse-over, highlight the node
        //@ts-ignore
        mouseDragEnter: (e, node) => node.isHighlighted = true,
        //@ts-ignore
        mouseDragLeave: (e, node) => node.isHighlighted = false,
        // on a mouse-drop add a link from the dropped-upon node to the new node
        mouseDrop: (e, node) => {
          
          const newnode = e.diagram.selection.first();
          if (!(node!==newnode)) return;
          //@ts-ignore
          const incoming = newnode.findLinksInto().first();
          if (incoming) e.diagram.remove(incoming);
          //@ts-ignore
          e.diagram.model.addLinkData( { from: node.key, to: newnode.key });
          console.log(" fin ");
          
        }
      },
        {
          contextMenu:
            $('ContextMenu',
              $('ContextMenuButton',
                $(go.TextBlock, 'Group'),
                { click: function(e, obj) { e.diagram.commandHandler.groupSelection(); } },
                new go.Binding('visible', '', function(o) {
                  return o.diagram.selection.count > 1;
                }).ofObject())
            )
        },
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        
        $(go.Panel, 'Auto',
          $(go.Shape, 'RoundedRectangle', { stroke: null },
            new go.Binding('fill', 'color', (c, panel) => {
             
              return c;
            }),
          
            new go.Binding("fill", "isHighlighted", (h, shape) => {
              if (h) return "red";
              const c = shape.part.data.color;
              return c ? c : "white";
            }).ofObject(),
          ),
          
          
          $(go.TextBlock, { margin: 8, editable: true },
            new go.Binding('text').makeTwoWay())
        ),
        // Ports
        makePort('t', go.Spot.TopCenter),
        makePort('l', go.Spot.Left),
        makePort('r', go.Spot.Right),
        makePort('b', go.Spot.BottomCenter)
      );

    return dia;
  }

  // When the diagram model changes, update app data to reflect those changes. Be sure to use immer's "produce" function to preserve immutability
  public diagramModelChange = (changes: go.IncrementalData) => {
    if (!changes) return;
    const appComp: any = this;
    this.state = produce(this.state, draft => {
      // set skipsDiagramUpdate: true since GoJS already has this update
      // this way, we don't log an unneeded transaction in the Diagram's undoManager history
      draft.skipsDiagramUpdate = true;
      //@ts-ignore
      draft.diagramNodeData = DataSyncService.syncNodeData(changes, draft.diagramNodeData, appComp.observedDiagram.model);
      //@ts-ignore
      draft.diagramLinkData = DataSyncService.syncLinkData(changes, draft.diagramLinkData, appComp.observedDiagram.model);
      //@ts-ignore
      draft.diagramModelData = DataSyncService.syncModelData(changes, draft.diagramModelData);
      // If one of the modified nodes was the selected node used by the inspector, update the inspector selectedNodeData object
      const modifiedNodeDatas = changes.modifiedNodeData;
      if (modifiedNodeDatas && draft.selectedNodeData) {
        for (let i = 0; i < modifiedNodeDatas.length; i++) {
          const mn = modifiedNodeDatas[i];
          const nodeKeyProperty = appComp.myDiagramComponent.diagram.model.nodeKeyProperty as string;
          if (mn[nodeKeyProperty] === draft.selectedNodeData?.[nodeKeyProperty]) {
           //@ts-ignore
            draft.selectedNodeData = mn;
          }
        }
      }
    });
  };

  public initPalette(): go.Palette {
    const $ = go.GraphObject.make;
    const palette = $(go.Palette);

    // define the Node template
    palette.nodeTemplate =
      $(go.Node, 'Auto',
        $(go.Shape, 'RoundedRectangle',
          {
            stroke: null
          },
          new go.Binding('fill', 'color')
        ),
        $(go.TextBlock, { margin: 8 },
          new go.Binding('text', 'key'))
      );

    palette.model = $(go.GraphLinksModel);
    return palette;
  }

  constructor(private cdr: ChangeDetectorRef, private diagramService: DiagramService) { }

  // Overview Component testing
  public oDivClassName = 'myOverviewDiv';
  public initOverview(): go.Overview {
    const $ = go.GraphObject.make;
    const overview = $(go.Overview);
    return overview;
  }
  public observedDiagram!: go.Diagram;

  // currently selected node; for inspector
  public selectedNodeData!: any;

  public ngAfterViewInit() {
    if (this.observedDiagram) return;
    this.observedDiagram = this.myDiagramComponent.diagram;

    this.diagramService.myDiagram =this.observedDiagram;

    this.attachListener();
    this.cdr.detectChanges(); // IMPORTANT: without this, Angular will throw ExpressionChangedAfterItHasBeenCheckedError (dev mode only)

    const appComp: AppComponent = this;
    // listener for inspector
    this.myDiagramComponent.diagram.addDiagramListener('ChangedSelection', function(e) {
      if (e.diagram.selection.count === 0) {
        appComp.selectedNodeData = undefined;
      }
      const node = e.diagram.selection.first();
      appComp.state = produce(appComp.state, draft => {
        if (node instanceof go.Node) {
          var idx = draft.diagramNodeData.findIndex(nd => nd.id == node.data.id);
          var nd = draft.diagramNodeData[idx];
          draft.selectedNodeData = nd;
        } else {
          draft.selectedNodeData = [];
        }
      });
    });
  } // end ngAfterViewInit


  /**
   * Update a node's data based on some change to an inspector row's input
   * @param changedPropAndVal An object with 2 entries: "prop" (the node data prop changed), and "newVal" (the value the user entered in the inspector <input>)
   */
  public handleInspectorChange(changedPropAndVal: any) {

   const path = changedPropAndVal.prop;
    const value = changedPropAndVal.newVal;

    this.state = produce(this.state, (draft) => {
      var data = draft.selectedNodeData;
   
      if(data)
      data[path] = value;
      const key = data['id'];
      const idx = draft.diagramNodeData.findIndex(nd => nd.id == key);
      if (idx >= 0) {
        draft.diagramNodeData[idx] = data;
        draft.skipsDiagramUpdate = false; // we need to sync GoJS data with this new app state, so do not skips Diagram update
      }
    });
  }


}
