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

  useEffect(() => {
    let controls: any;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let frameId: number;

    const init = async () => {
      try {
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
        const { MTLLoader } = await import('three/examples/jsm/loaders/MTLLoader.js');

        if (!mountRef.current) return;

        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x121212);

        // Grid helper for orientation
        const gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);

        // Camera setup
        camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.set(0, 2, 5);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000);
        renderer.outputColorSpace = THREE.SRGBColorSpace;

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

        // Load texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setPath('/models/');
        
        // Load material and object
        const mtlLoader = new MTLLoader();
        mtlLoader.setPath('/models/');
        
        mtlLoader.load(
          'capsule.mtl',
          (materials) => {
            materials.preload();

            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('/models/');
            
            objLoader.load(
              'capsule.obj',
              (object) => {
                // Center the object
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                // Position at origin
                object.position.sub(center);
                
                // Apply texture to all meshes if needed
                textureLoader.load(
                  'capsule0.jpg',
                  (texture) => {
                    object.traverse((child) => {
                      if (child instanceof THREE.Mesh) {
                        // Create material with the loaded texture
                        const material = new THREE.MeshPhongMaterial({
                          map: texture,
                          shininess: 50
                        });
                        
                        // Apply the material to the mesh
                        child.material = material;
                      }
                    });
                  }
                );
                
                scene.add(object);
                
                // Extract and set metadata
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
                
                // Adjust camera to fit the object
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
                cameraZ *= 2; // Add margin
                
                camera.position.set(0, maxDim/2, cameraZ);
                camera.lookAt(0, 0, 0);
                
                camera.near = 0.1;
                camera.far = 1000;
                camera.updateProjectionMatrix();
                
                setLoading(false);
              },
              // Progress callback
              (xhr) => {
                // Optional progress tracking if needed
              },
              // Error callback
              (error) => {
                console.error('OBJ Load Error:', error);
                setError('Failed to load 3D model. Please check if model files exist in the correct location.');
                setLoading(false);
              }
            );
          },
          undefined,
          (error) => {
            console.error('MTL Load Error:', error);
            
            // Fallback: Try loading OBJ without materials
            const objLoader = new OBJLoader();
            objLoader.setPath('/models/');
            
            objLoader.load(
              'capsule.obj',
              (object) => {
                // Center the object
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                object.position.sub(center);
                
                // Apply a default material
                object.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshPhongMaterial({ 
                      color: 0xcccccc,
                      shininess: 50
                    });
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
                console.error('Fallback OBJ load failed:', objError);
                setError('Failed to load model with or without materials.');
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

        // Handle window resize
        window.addEventListener('resize', handleResize);
      } catch (err) {
        console.error("Initialization error:", err);
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
      
      {/* Controls help */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-sm">
        <p>Left-click: Rotate | Right-click: Pan | Scroll: Zoom</p>
      </div>
    </div>
  );
};

export default Viewer;