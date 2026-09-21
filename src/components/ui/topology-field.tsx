import { useMemo, type CSSProperties } from "react";

type EffectMode = "light" | "dark";

type FocusRole = "background" | "button" | "visual";

type FocusTarget = {
  selector: string;
  role: FocusRole;
  fit?: "cover" | "contain-square" | "wide-wordmark" | "portrait-stage";
  preserveTransform?: boolean;
};

type EffectDefinition = {
  title: string;
  source: string;
  background: string;
  targets: readonly FocusTarget[];
  theme?: {
    nativeMode?: EffectMode;
    lightBackground: string;
    darkBackground: string;
    invertBackground?: boolean;
  };
  hiddenTargets?: readonly string[];
};

export type TopologyFieldProps = {
  mode?: EffectMode;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
};

export const TOPOLOGY_FIELD_DEFAULTS = {
  mode: "dark",
  hue: 0,
  saturation: 1,
  brightness: 1,
} as const;

const topologySource = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Architecture - Topology</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap" rel="stylesheet">
</head>
<body class="text-gray-100 antialiased selection:bg-zinc-800 selection:text-white" style="font-family: 'Inter', sans-serif; background: radial-gradient(circle at bottom right, #18181b 0%, #000000 50%, #000000 100%); overflow: hidden; margin: 0; padding: 0; height: 100vh; width: 100vw;">

    <div id="canvasGlow" class="absolute pointer-events-none rounded-full blur-[120px] opacity-[0.15] bg-white transition-all duration-1000" style="z-index: 0; transform: translate(-50%, -50%);"></div>
    <canvas id="animationCanvas" class="absolute inset-0 w-full h-full z-0 pointer-events-none"></canvas>

    <header class="absolute top-10 left-12 right-12 z-50 flex justify-between items-center pointer-events-auto">
        <div class="flex items-center gap-3">
            <iconify-icon icon="solar:globus-linear" class="text-3xl text-white"></iconify-icon>
            <span class="text-xl tracking-tighter font-light text-white">Nexus Architecture</span>
        </div>
        <div class="text-xs tracking-widest uppercase text-gray-500 font-normal">System Topology</div>
    </header>

    <main class="relative z-10 w-full h-full flex items-center">
        
        <div class="pl-12 md:pl-20 max-w-[55vw] z-20 pointer-events-none">
            <h1 class="text-[clamp(4rem,8vw,10rem)] tracking-tighter font-light text-white leading-[0.85] mb-10">
                Expand vs<br>Refine
            </h1>
            <div class="text-xl md:text-2xl text-gray-400 font-light max-w-[42vw] leading-snug flex flex-col gap-8">
                <ul class="list-disc pl-6 text-gray-200 flex flex-col gap-3 marker:text-gray-500">
                    <li>Refinement sharpens focus.</li>
                    <li>Expansion broadens scope.</li>
                </ul>
                <p>
                    Understanding this duality is crucial for system architects. When the core logic holds, refine the parameters. When the constraints limit potential, expand the boundaries. Suboptimal scaling often results from misapplying these principles during rapid deployment.
                </p>
            </div>
        </div>

        <div class="absolute inset-0 pointer-events-none hidden md:block z-20">
            
            <div class="absolute top-[28%] left-[58%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full px-4 py-1.5 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-200">48.2 TB/s</span>
                </div>
                <div class="absolute -right-3 top-1/2 -mt-1 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s;"></div>
                </div>
            </div>

            <div class="absolute top-[18%] left-[72%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="3">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full px-4 py-1.5 flex items-center gap-1.5 justify-center">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <iconify-icon icon="solar:users-group-rounded-linear" class="text-gray-300 text-sm"></iconify-icon>
                    <span class="text-xs font-light text-gray-200">+3,420</span>
                </div>
                <div class="absolute -bottom-3 left-1/2 -ml-1 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 0.5s;"></div>
                </div>
            </div>

            <div class="absolute top-[35%] left-[82%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full px-4 py-1.5 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-200">2.8 TB/s</span>
                </div>
            </div>

            <div class="absolute top-[45%] left-[52%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="absolute -top-12 -right-8 bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-2 w-max">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-300">Ledger synced.</span>
                    <div class="absolute -bottom-2 left-4 w-4 h-4 bg-zinc-900/80 border-b border-r border-white/5 transform rotate-45 backdrop-blur-md"></div>
                </div>
                <div class="bg-black/40 backdrop-blur-md shadow-2xl rounded-full p-1.5 relative z-10">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <img src="https://cdn.21st.dev/assets/mirror/a3/a37358a09c532474e3246a94e5e5104b1b6b6907f83b44259509f8c776506120.jpg" alt="Node Operator" class="w-12 h-12 rounded-full object-cover grayscale opacity-80">
                </div>
                <div class="absolute -bottom-4 left-1/2 -ml-1 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 1s;"></div>
                </div>
            </div>

            <div class="absolute top-[58%] left-[62%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="3">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl p-3 shadow-lg">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <iconify-icon icon="solar:user-circle-linear" class="text-gray-400 text-3xl"></iconify-icon>
                </div>
                <div class="absolute -bottom-4 left-1/2 -ml-1 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 0.2s;"></div>
                </div>
            </div>

            <div class="absolute top-[55%] left-[88%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full px-4 py-1.5 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-200">9.12 PB/s</span>
                </div>
            </div>

            <div class="absolute top-[72%] left-[55%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="3">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <div class="rounded-full border border-zinc-700 p-0.5">
                        <iconify-icon icon="solar:user-circle-linear" class="text-gray-300 text-2xl"></iconify-icon>
                    </div>
                    <div>
                        <div class="text-xs font-light text-gray-200">AP-South-2</div>
                        <div class="text-xs font-light text-gray-500">Replicating</div>
                    </div>
                </div>
            </div>

            <div class="absolute top-[80%] left-[75%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <div class="rounded-full border border-zinc-700 p-0.5">
                        <iconify-icon icon="solar:user-circle-linear" class="text-gray-300 text-2xl"></iconify-icon>
                    </div>
                    <div>
                        <div class="text-xs font-light text-gray-200">EU-North-1</div>
                        <div class="text-xs font-light text-gray-500">Validating</div>
                    </div>
                </div>
                <div class="absolute -bottom-4 left-12 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 0.8s;"></div>
                </div>
            </div>

            <div class="absolute top-[40%] left-[72%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="absolute -top-10 -right-6 bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-2 w-max z-10">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-300">Payload secured.</span>
                </div>
                <div class="bg-black/40 backdrop-blur-md shadow-2xl rounded-full p-2 relative z-0">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <div class="w-10 h-10 bg-zinc-800/80 rounded-full flex items-center justify-center shadow-inner">
                        <iconify-icon icon="solar:rocket-linear" class="text-white text-xl"></iconify-icon>
                    </div>
                </div>
                <div class="absolute top-12 left-6 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 1.5s;"></div>
                </div>
            </div>

            <div class="absolute top-[68%] left-[82%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="absolute -top-10 -left-12 bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-2 w-max">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-300">Channel encrypted.</span>
                </div>
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full p-2">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <div class="w-8 h-8 bg-zinc-800/80 border border-zinc-600/50 rounded-full flex items-center justify-center shadow-sm">
                        <iconify-icon icon="solar:bolt-linear" class="text-gray-200 text-lg"></iconify-icon>
                    </div>
                </div>
                <div class="absolute -bottom-3 left-5 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 1.1s;"></div>
                </div>
            </div>

        </div>

    </main>

    <footer class="absolute bottom-10 left-12 right-12 z-50 flex justify-between items-center pointer-events-auto">
        <div class="text-xs tracking-widest uppercase text-gray-500 font-normal">Internal Draft & Restricted</div>
        <div class="text-xs tracking-widest uppercase text-gray-500 font-normal">01</div>
    </footer>

    <script>
        const canvas = document.getElementById('animationCanvas');
        const floaters = document.querySelectorAll('[data-float]');
        
        let width = window.innerWidth;
        let height = window.innerHeight;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0a0a, 300, 950);

        const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
        camera.position.z = 650;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const group = new THREE.Group();
        scene.add(group);

        const numNodes = 120;
        const nodes = [];
        const nodeGeo = new THREE.SphereGeometry(1, 16, 16);
        
        for(let i = 0; i < numNodes; i++) {
            let phi = Math.acos(-1 + (2 * i) / numNodes);
            let theta = Math.sqrt(numNodes * Math.PI) * phi;
            let x = Math.cos(theta) * Math.sin(phi);
            let y = Math.sin(theta) * Math.sin(phi);
            let z = Math.cos(phi);

            let mesh = new THREE.Mesh(
                nodeGeo,
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
            );
            mesh.position.set(x, y, z);
            mesh.userData = {
                baseSize: Math.random() * 1.5 + 1.0,
                pulseSpeed: Math.random() * 0.02 + 0.015,
                pulseOffset: Math.random() * Math.PI * 2
            };
            group.add(mesh);
            nodes.push(mesh);
        }

        const linePos = [];
        const lineColors = [];
        for(let i = 0; i < numNodes; i++) {
            for(let j = i + 1; j < numNodes; j++) {
                let dist = nodes[i].position.distanceTo(nodes[j].position);
                const threshold = 0.45;
                if(dist < threshold) {
                    linePos.push(nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
                    linePos.push(nodes[j].position.x, nodes[j].position.y, nodes[j].position.z);
                    
                    let alpha = (1 - dist / threshold) * 0.8;
                    lineColors.push(alpha, alpha, alpha);
                    lineColors.push(alpha, alpha, alpha);
                }
            }
        }
        
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
        lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
        const lineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.65
        });
        const lines = new THREE.LineSegments(lineGeo, lineMat);
        group.add(lines);

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            
            const R = width > 768 ? 380 : Math.max(230, Math.min(width, height) * 0.4);
            group.scale.set(R, R, R);
            
            const centerX = width > 768 ? width * 0.2 : 0; 
            const centerY = width > 768 ? -height * 0.05 : height * 0.05;
            group.position.set(centerX, centerY, 0);

            const glow = document.getElementById('canvasGlow');
            if (glow) {
                glow.style.left = \`\${(width / 2) + centerX}px\`;
                glow.style.top = \`\${(height / 2) - centerY}px\`;
                glow.style.width = \`\${R * 2.8}px\`;
                glow.style.height = \`\${R * 2.8}px\`;
            }
        }

        window.addEventListener('resize', resize);
        resize();

        let time = 0;
        function animate() {
            requestAnimationFrame(animate);
            time += 1;
            
            group.rotation.y = time * 0.0018;
            group.rotation.x = 0.2;
            group.rotation.z = time * 0.0006;

            nodes.forEach(mesh => {
                let p = mesh.userData;
                let pulse = (Math.sin((time * p.pulseSpeed) + p.pulseOffset) + 1) / 2;
                
                let targetRadius = p.baseSize + pulse * 1.8;
                let scale = targetRadius / group.scale.x;
                
                mesh.scale.set(scale, scale, scale);
                mesh.material.opacity = 0.4 + (pulse * 0.6);
            });

            floaters.forEach(el => {
                const offset = Number(el.getAttribute('data-float-offset'));
                const y = Math.sin((time * 0.02) + offset) * 12;
                const rot = Math.cos((time * 0.015) + offset) * 1.5;
                el.style.transform = \`translateY(\${y}px) rotate(\${rot}deg)\`;
            });

            renderer.render(scene, camera);
        }
        
        animate();
    </script>
</body>
</html>`;

const EFFECT: EffectDefinition = {
  title: "Nexus topology field",
  source: topologySource,
  background: "#070707",
  targets: [{ selector: "#animationCanvas", role: "background" }],
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function effectBackground(definition: EffectDefinition, mode: EffectMode) {
  return definition.theme?.[`${mode}Background`] ?? definition.background;
}

function buildFocusedDocument(definition: EffectDefinition, mode: EffectMode) {
  const background = effectBackground(definition, mode);
  const invertBackground =
    definition.theme?.invertBackground === true &&
    definition.theme.nativeMode !== mode;
  const source = definition.source;
  const targetJson = JSON.stringify(definition.targets).replace(
    /</g,
    "\\u003c",
  );
  const hiddenTargetJson = JSON.stringify(
    definition.hiddenTargets ?? [],
  ).replace(/</g, "\\u003c");
  const modeJson = JSON.stringify(mode);
  const backgroundFilter = invertBackground
    ? "filter: invert(1) hue-rotate(180deg) saturate(.92) brightness(1.02) !important;"
    : "";
  const focusStyle = `<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${background} !important; color-scheme: ${mode} !important; }
body { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
body > * { visibility: hidden !important; }
body[data-threeui-ready] > [data-threeui-role] { visibility: visible !important; }
[data-threeui-residual] { display: none !important; }
[data-threeui-hidden] { display: none !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; ${backgroundFilter} }
</style>`;
  const focusScript = `<script data-threeui-focus>
(function () {
  document.documentElement.dataset.sfMode = ${modeJson};
  var isolated = false;
  function isolate() {
    if (isolated) return;
    var specs = ${targetJson};
    var hiddenSelectors = ${hiddenTargetJson};
    var roots = [];
    hiddenSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (element) {
        element.setAttribute('data-threeui-hidden', '');
        element.setAttribute('aria-hidden', 'true');
        if ('inert' in element) element.inert = true;
      });
    });
    specs.forEach(function (spec) {
      var element = document.querySelector(spec.selector);
      if (!element) return;
      element.setAttribute('data-threeui-role', spec.role);
      if (spec.fit) element.setAttribute('data-threeui-fit', spec.fit);
      if (spec.preserveTransform) element.setAttribute('data-threeui-preserve-transform', '');
      if (!roots.some(function (root) { return root.contains(element); })) roots.push(element);
    });
    if (!roots.length) return;
    isolated = true;
    roots.forEach(function (root) {
      var placeholderLink = root.matches('a[href="#"]') ? root : root.querySelector('a[href="#"]');
      if (placeholderLink) placeholderLink.addEventListener('click', function (event) { event.preventDefault(); });
      document.body.appendChild(root);
    });
    Array.from(document.body.children).forEach(function (element) {
      if (roots.indexOf(element) !== -1) return;
      element.setAttribute('data-threeui-residual', '');
      element.setAttribute('aria-hidden', 'true');
      if ('inert' in element) element.inert = true;
    });
    document.body.setAttribute('data-threeui-ready', '');
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }
  function scheduleIsolation() { setTimeout(isolate, 100); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleIsolation, { once: true });
  else scheduleIsolation();
  window.addEventListener('load', isolate, { once: true });
})();
</script>`;
  return source
    .replace(/<\/head>/i, `${focusStyle}</head>`)
    .replace(/<\/body>/i, `${focusScript}</body>`);
}

export default function TopologyField({
  mode = TOPOLOGY_FIELD_DEFAULTS.mode,
  hue = TOPOLOGY_FIELD_DEFAULTS.hue,
  saturation = TOPOLOGY_FIELD_DEFAULTS.saturation,
  brightness = TOPOLOGY_FIELD_DEFAULTS.brightness,
  className,
  style,
}: TopologyFieldProps) {
  const safeMode: EffectMode = mode === "light" ? "light" : "dark";
  const background = effectBackground(EFFECT, safeMode);
  const source = useMemo(
    () => buildFocusedDocument(EFFECT, safeMode),
    [safeMode],
  );
  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);
  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <iframe
      className={className}
      data-mode={safeMode}
      title={EFFECT.title}
      srcDoc={source}
      sandbox="allow-scripts"
      loading="eager"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        border: 0,
        background,
        filter,
        ...style,
      }}
    />
  );
}