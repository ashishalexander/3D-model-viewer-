# 3D Model Viewer

A simple and interactive 3D model viewer built with **Next.js**, **Three.js**, and **TypeScript**. This application allows you to load and view `.obj` models with `.mtl` materials directly in the browser.

## 🚀 Features

- Load and render `.obj` and `.mtl` 3D models
- Interactive camera controls (rotate, pan, zoom)
- Automatic model centering and scaling
- Grid and lighting setup for better visualization
- Model statistics display (vertices, faces, materials, dimensions)
- Responsive design that works across devices

## 🧰 Tech Stack

- [Next.js](https://nextjs.org/) - React framework for production
- [Three.js](https://threejs.org/) - JavaScript 3D library
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

## 📁 Project Structure

```
3d-viewer/
├── .next/                  # Next.js build output
├── node_modules/           # Project dependencies
├── public/                 # Static assets
│   └── models/             # 3D model files (.obj, .mtl, textures)
│       ├── capsule.mtl
│       ├── capsule.obj
│       └── capsule0.jpg
├── src/                    # Source code
│   ├── app/                # Next.js app directory
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout component
│   │   └── page.tsx        # Main page component
│   ├── components/         # React components
│   │   └── Viewer.tsx      # 3D viewer component
│   └── types/              # TypeScript type definitions
│       └── three-extend.d.ts  # Three.js type extensions
├── .gitignore              # Git ignore file
├── eslint.config.mjs       # ESLint configuration
├── next-env.d.ts           # Next.js TypeScript declarations
├── next.config.ts          # Next.js configuration
├── package-lock.json       # Dependency lock file
├── package.json            # Project metadata and dependencies
├── postcss.config.mjs      # PostCSS configuration
├── README.md               # Project documentation
└── tsconfig.json           # TypeScript configuration
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/3d-model-viewer.git
   cd 3d-model-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🖼️ Loading Custom Models

To add your own 3D models:

1. Place your `.obj`, `.mtl`, and texture files in the `public/models/` directory
2. Update the model paths in `src/components/Viewer.tsx`:

```typescript
// Example:
const loadModel = () => {
  const mtlLoader = new MTLLoader();
  mtlLoader.load("/models/your-model.mtl", (materials) => {
    materials.preload();
    
    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.load("/models/your-model.obj", (object) => {
      // Handle the loaded object
    });
  });
};
```

## 📦 Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) community for excellent documentation and examples
- [Next.js](https://nextjs.org/) team for creating a powerful React framework