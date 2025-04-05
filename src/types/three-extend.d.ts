declare module 'three/examples/jsm/loaders/MTLLoader' {
    import { LoadingManager } from 'three';
    import { MaterialCreator } from 'three/examples/jsm/loaders/MTLLoader';
    export class MTLLoader {
      constructor(manager?: LoadingManager);
      setPath(path: string): this;
      load(
        url: string,
        onLoad: (materialCreator: MaterialCreator) => void,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent) => void
      ): void;
    }
  }
  
  declare module 'three/examples/jsm/loaders/OBJLoader' {
    import {
      LoadingManager,
      Object3D,
    } from 'three';
    import { MaterialCreator } from 'three/examples/jsm/loaders/MTLLoader';
    export class OBJLoader {
      constructor(manager?: LoadingManager);
      setPath(path: string): this;
      setMaterials(materials: MaterialCreator): this;
      load(
        url: string,
        onLoad: (object: Object3D) => void,
        onProgress?: (event: ProgressEvent<EventTarget>) => void,
        onError?: (event: ErrorEvent) => void
      ): void;
    }
  }
  
  declare module 'three/examples/jsm/controls/OrbitControls' {
    import { Camera, EventDispatcher } from 'three';
    
    export class OrbitControls extends EventDispatcher {
      constructor(camera: Camera, domElement?: HTMLElement);
      enableDamping: boolean;
      dampingFactor: number;
      update(): void;
    }
  }