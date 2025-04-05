'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ModelMetadata {
  vertices: number;
  faces: number;
  materials: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
}

const Viewer = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);

  // Helper function to add debug messages
  const addDebug = (message: string) => {
    console.log(message);
    setDebug(prev => [...prev, message]);
  };

  useEffect(() => {
    let controls: any;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let frameId: number;

    const init = async () => {
      try {
        addDebug("Initializing 3D viewer...");
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
        const { MTLLoader } = await import('three/examples/jsm/loaders/MTLLoader.js');

        if (!mountRef.current) return;

        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x121212);
        addDebug("Scene created");

        // Grid helper
        const gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);

        // Axes helper for orientation
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
        addDebug("Helpers added to scene");

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Add a point light for better visibility
        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);
        addDebug("Lights added to scene");

        // Camera setup
        camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.set(0, 2, 5); // Position camera explicitly
        addDebug(`Camera initial position: ${camera.position.x}, ${camera.position.y}, ${camera.position.z}`);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        addDebug("Renderer initialized");

        // Clear previous content and append renderer
        mountRef.current.innerHTML = '';
        mountRef.current.appendChild(renderer.domElement);

        // Controls setup
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI;
        controls.target.set(0, 0, 0);
        controls.update();
        addDebug("Controls initialized");

        // Add a simple test object to verify rendering
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xff0000,
          transparent: true,
          opacity: 0.5
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, 0, 0);
        scene.add(cube);
        addDebug("Test cube added to scene");

        // Load material and object
        addDebug("Starting model loading process");
        
        // Preload texture to be applied to the model
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setPath('/models/');
        
        // Load texture first (you can change the texture filename as needed)
        textureLoader.load(
          'capsule0.jpg',
          (texture) => {
            addDebug("Texture loaded successfully");
            
            // After texture is loaded, continue with loading materials and object
            const mtlLoader = new MTLLoader();
            mtlLoader.setPath('/models/');
            mtlLoader.load(
              'capsule.mtl',
              (materials) => {
                addDebug("MTL file loaded successfully");
                materials.preload();

                const objLoader = new OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.setPath('/models/');
                objLoader.load(
                  'capsule.obj',
                  (object) => {
                    addDebug("OBJ file loaded successfully");
                    
                    // Log the object to inspect structure
                    console.log("Loaded object:", object);
                    
                    // Center the object
                    const box = new THREE.Box3().setFromObject(object);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    
                    addDebug(`Model bounds: min(${box.min.x.toFixed(2)}, ${box.min.y.toFixed(2)}, ${box.min.z.toFixed(2)}), ` +
                            `max(${box.max.x.toFixed(2)}, ${box.max.y.toFixed(2)}, ${box.max.z.toFixed(2)})`);
                    addDebug(`Model center: ${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`);
                    addDebug(`Model size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
                    
                    // Center the object
                    object.position.sub(center);
                    addDebug("Positioning approach: Centering at origin");
                    
                    // Apply texture to all meshes
                    object.traverse((child) => {
                      if (child instanceof THREE.Mesh) {
                        // Create material with the loaded texture
                        const material = new THREE.MeshPhongMaterial({
                          map: texture,
                          shininess: 50,
                          transparent: false,
                          opacity: 1.0
                        });
                        
                        // Apply the material to the mesh
                        child.material = material;
                        addDebug(`Applied texture to mesh: ${child.name || 'unnamed'}`);
                      }
                    });
                    
                    scene.add(object);
                    addDebug("Model added to scene");
                    
                    // Add visible bounding box
                    const boxHelper = new THREE.Box3Helper(box, 0xffff00);
                    scene.add(boxHelper);
                    addDebug("Bounding box helper added");
                    
                    // Add wireframe to see the structure
                    const wireframeGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
                    const wireframeMaterial = new THREE.MeshBasicMaterial({
                      color: 0xff00ff,
                      wireframe: true
                    });
                    const wireframeCube = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
                    wireframeCube.position.copy(object.position);
                    scene.add(wireframeCube);
                    addDebug("Wireframe added");
                    
                    // Update metadata
                    const materialCount = new Set();
                    object.traverse((child) => {
                      if (child instanceof THREE.Mesh) {
                        if (child.material) materialCount.add(child.material);
                      }
                    });
                    
                    // Extract and set metadata
                    setModelMetadata({
                      vertices: countVertices(object),
                      faces: countFaces(object),
                      materials: materialCount.size,
                      dimensions: {
                        width: size.x,
                        height: size.y,
                        depth: size.z
                      }
                    });
                    
                    // Adjust camera to fit the object
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const fov = camera.fov * (Math.PI / 180);
                    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
                    cameraZ *= 2; // Add margin
                    
                    // Explicitly position camera to see the object
                    camera.position.set(0, maxDim/2, cameraZ);
                    camera.lookAt(0, 0, 0);
                    
                    camera.near = 0.1;
                    camera.far = 1000;
                    camera.updateProjectionMatrix();
                    
                    addDebug(`Adjusted camera position: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}`);
                    addDebug(`Camera FOV: ${camera.fov}, aspect: ${camera.aspect.toFixed(2)}`);
                    
                    setLoading(false);
                  },
                  (xhr) => {
                    // Progress tracking
                    const progress = (xhr.loaded / xhr.total) * 100;
                    addDebug(`Loading progress: ${progress.toFixed(2)}%`);
                  },
                  (error) => {
                    console.error('OBJ Load Error:', error);
                    addDebug(`OBJ Load Error: ${error.message}`);
                    setError('Failed to load 3D model. Please check if model files exist in the correct location.');
                    setLoading(false);
                  }
                );
              },
              undefined,
              (error) => {
                console.error('MTL Load Error:', error);
                addDebug(`MTL Load Error: ${error.message}`);
                
                // Try loading OBJ without materials as fallback, but still apply texture
                addDebug("Attempting to load OBJ without materials as fallback");
                const objLoader = new OBJLoader();
                objLoader.setPath('/models/');
                objLoader.load(
                  'capsule.obj',
                  (object) => {
                    addDebug("OBJ loaded without materials");
                    
                    // Center the object
                    const box = new THREE.Box3().setFromObject(object);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    
                    object.position.sub(center);
                    
                    // Apply texture to all meshes
                    object.traverse((child) => {
                      if (child instanceof THREE.Mesh) {
                        // Create material with the loaded texture
                        const material = new THREE.MeshPhongMaterial({
                          map: texture,
                          shininess: 50
                        });
                        
                        // Apply the material to the mesh
                        child.material = material;
                        addDebug(`Applied texture to mesh (fallback): ${child.name || 'unnamed'}`);
                      }
                    });
                    
                    scene.add(object);
                    
                    setModelMetadata({
                      vertices: countVertices(object),
                      faces: countFaces(object),
                      materials: 1,
                      dimensions: {
                        width: size.x,
                        height: size.y,
                        depth: size.z
                      }
                    });
                    
                    setLoading(false);
                  },
                  undefined,
                  (objError) => {
                    addDebug(`Fallback OBJ load failed: ${objError.message}`);
                    setError('Failed to load model with or without materials.');
                    setLoading(false);
                  }
                );
              }
            );
          },
          (xhr) => {
            // Texture loading progress
            if (xhr.lengthComputable) {
              const progress = (xhr.loaded / xhr.total) * 100;
              addDebug(`Texture loading progress: ${progress.toFixed(2)}%`);
            }
          },
          (error) => {
            // Texture loading error - continue with model loading but warn about texture
            console.error('Texture Load Error:', error);
            addDebug(`Texture Load Error: ${error.message}`);
            addDebug("Continuing with model loading without custom texture");
            
            // Continue with regular material and obj loading
            const mtlLoader = new MTLLoader();
            mtlLoader.setPath('/models/');
            mtlLoader.load(
              'capsule.mtl',
              (materials) => {
                // Similar loading code as above, but without texture application
                // ...proceed with regular loading
                addDebug("MTL file loaded successfully (without custom texture)");
                materials.preload();
                
                const objLoader = new OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.setPath('/models/');
                objLoader.load(
                  'capsule.obj',
                  (object) => {
                    // Process object without texture
                    // (Simplified version of the code above)
                    addDebug("OBJ file loaded successfully (without custom texture)");
                    
                    // Center the object
                    const box = new THREE.Box3().setFromObject(object);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    
                    object.position.sub(center);
                    scene.add(object);
                    
                    // Update metadata and finish loading
                    const materialCount = new Set();
                    object.traverse((child) => {
                      if (child instanceof THREE.Mesh) {
                        if (child.material) materialCount.add(child.material);
                      }
                    });
                    
                    setModelMetadata({
                      vertices: countVertices(object),
                      faces: countFaces(object),
                      materials: materialCount.size,
                      dimensions: {
                        width: size.x,
                        height: size.y,
                        depth: size.z
                      }
                    });
                    
                    setLoading(false);
                  },
                  undefined,
                  (objError) => {
                    // Handle OBJ loading error
                    console.error('OBJ Load Error:', objError);
                    addDebug(`OBJ Load Error: ${objError.message}`);
                    setError('Failed to load 3D model without texture.');
                    setLoading(false);
                  }
                );
              },
              undefined,
              (mtlError) => {
                // Handle material loading error
                console.error('MTL Load Error:', mtlError);
                addDebug(`MTL Load Error: ${mtlError.message}`);
                setError('Failed to load materials and texture.');
                setLoading(false);
              }
            );
          }
        );

        // Animation loop
        const animate = () => {
          frameId = requestAnimationFrame(animate);
          if (controls) controls.update();
          if (renderer && scene && camera) {
            renderer.render(scene, camera);
          }
        };

        animate();
        addDebug("Animation loop started");

        // Handle window resize
        window.addEventListener('resize', handleResize);
      } catch (err) {
        console.error("Initialization error:", err);
        addDebug(`Initialization error: ${err instanceof Error ? err.message : String(err)}`);
        setError("Failed to initialize 3D viewer");
        setLoading(false);
      }
    };

    // Count vertices in the model
    const countVertices = (object: THREE.Object3D): number => {
      let count = 0;
      
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const geometry = child.geometry;
          if (geometry instanceof THREE.BufferGeometry) {
            const position = geometry.getAttribute('position');
            if (position) {
              count += position.count;
            }
          }
        }
      });
      
      return count;
    };

    // Count faces in the model
    const countFaces = (object: THREE.Object3D): number => {
      let count = 0;
      
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const geometry = child.geometry;
          if (geometry instanceof THREE.BufferGeometry) {
            const index = geometry.getIndex();
            if (index) {
              count += index.count / 3;
            } else {
              const position = geometry.getAttribute('position');
              if (position) {
                count += position.count / 3;
              }
            }
          }
        }
      });
      
      return count;
    };

    const handleResize = () => {
      if (!renderer || !camera || !mountRef.current) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    init();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId) cancelAnimationFrame(frameId);
      if (renderer && mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full"
        style={{
          position: 'relative',
          overflow: 'hidden',
        }}
      />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded">
          Loading model...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-4 bg-red-900 bg-opacity-90 text-white p-3 rounded">
          {error}
        </div>
      )}
      
      {/* Model metadata panel */}
      {modelMetadata && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded max-w-xs">
          <h3 className="text-lg font-bold mb-2">Model Details</h3>
          <div>
            <p>Vertices: {modelMetadata.vertices}</p>
            <p>Faces: {modelMetadata.faces}</p>
            <p>Materials: {modelMetadata.materials}</p>
            <p>Dimensions: {modelMetadata.dimensions.width.toFixed(2)} x {modelMetadata.dimensions.height.toFixed(2)} x {modelMetadata.dimensions.depth.toFixed(2)}</p>
          </div>
        </div>
      )}
      
      {/* Debug panel */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded max-w-xs max-h-96 overflow-y-auto" style={{ fontSize: '12px' }}>
        <h3 className="text-lg font-bold mb-2">Debug Info</h3>
        <ul>
          {debug.map((msg, i) => (
            <li key={i} className="mb-1">{msg}</li>
          ))}
        </ul>
      </div>
      
      {/* Controls help */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-sm">
        <p>Left-click: Rotate | Right-click: Pan | Scroll: Zoom</p>
      </div>
    </div>
  );
};

export default Viewer;