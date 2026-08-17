import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import * as THREE from 'three';

export const ThreeBackground: FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Particle field ──────────────────────────────────────────────
    const COUNT = 2200;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);

    // Theme palette: red-bright #FF2A2A, red #E01B22, amber #E08A17, off-white #F7F2F2
    const redBright  = new THREE.Color('#FF2A2A');
    const redMid     = new THREE.Color('#E01B22');
    const amber      = new THREE.Color('#E08A17');
    const offWhite   = new THREE.Color('#F7F2F2');

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;

      const r = Math.random();
      const c = r < 0.35 ? redBright : r < 0.6 ? redMid : r < 0.75 ? amber : offWhite;
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.022,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Wireframe icosahedra ─────────────────────────────────────────
    const makeIco = (radius: number, color: string, opacity: number) => {
      const geo = new THREE.IcosahedronGeometry(radius, 1);
      const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
      return { mesh: new THREE.Mesh(geo, mat), geo, mat };
    };

    const ico1 = makeIco(1.4, '#E01B22', 0.07);
    scene.add(ico1.mesh);

    const ico2 = makeIco(0.8, '#FF2A2A', 0.1);
    ico2.mesh.position.set(3, -1.2, -1.5);
    scene.add(ico2.mesh);

    const ico3 = makeIco(0.5, '#E08A17', 0.09);
    ico3.mesh.position.set(-3, 1.5, -2);
    scene.add(ico3.mesh);

    // ── Floating ring ────────────────────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(2.2, 0.008, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#7E0910', transparent: true, opacity: 0.18 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // ── Mouse parallax ───────────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Resize ───────────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ───────────────────────────────────────────────
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      particles.rotation.y = t * 0.03;
      particles.rotation.x = t * 0.015;

      ico1.mesh.rotation.x = t * 0.12;
      ico1.mesh.rotation.y = t * 0.18;

      ico2.mesh.rotation.x = -t * 0.2;
      ico2.mesh.rotation.y =  t * 0.14;

      ico3.mesh.rotation.z = t * 0.16;
      ico3.mesh.rotation.x = t * 0.1;

      ring.rotation.z = t * 0.05;

      // Smooth mouse parallax
      camera.position.x += (mouse.x * 0.4 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      pGeo.dispose(); pMat.dispose();
      ico1.geo.dispose(); ico1.mat.dispose();
      ico2.geo.dispose(); ico2.mat.dispose();
      ico3.geo.dispose(); ico3.mat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none', zIndex: 0 }}
    />
  );
};
