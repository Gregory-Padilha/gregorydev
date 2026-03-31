import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Smooth Disclosure for Sections
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 2. Scroll Progress & Nav Background
    const header = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        // Toggle Scrolled Class for Nav
        if (scrolled > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        const height = document.documentElement.scrollHeight - window.innerHeight;
        const percentage = Math.min(100, Math.max(0, (scrolled / height) * 100));
        const progressBar = document.getElementById('scroll-progress-bar');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    });

    // 3. Three.js - Exploded View 3D Background
    const setupThreeJS = () => {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) return;

        if (window.innerWidth < 768) {
            canvas.style.display = 'none';
            return; // Only load on Desktop/Tablet
        }

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 10);
        camera.lookAt(0, 0, 0);

        // Soft Matte Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);

        const rimLight = new THREE.DirectionalLight(0x42e5b0, 2);
        rimLight.position.set(-5, -5, -5);
        scene.add(rimLight);

        // Interface Layers Creator
        const colors = {
            background: 0x1a1f1c, // Base very dark glass
            card: 0x2a2f2b, // Headers, blocks
            text: 0x555d58, // Text mockups
            accent: 0x42e5b0  // Obsidian green
        };

        const uiGroup = new THREE.Group();
        scene.add(uiGroup);

        const createLayer = (width, height, color, initialPos, initialRot, opacity = 0.5, renderOrder = 0) => {
            const geometry = new THREE.PlaneGeometry(width, height);
            const material = new THREE.MeshPhysicalMaterial({ 
                color,
                transparent: true,
                opacity: opacity,
                roughness: 0.8, // Matte finish
                metalness: 0.1, 
                clearcoat: 0.05, // Subtle glass sheen
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...initialPos);
            mesh.rotation.set(...initialRot);
            mesh.renderOrder = renderOrder; // Force depth sorting rendering order
            uiGroup.add(mesh); // Add to responsive group instead of raw scene
            return mesh;
        };

        const finalRot = [0, -0.4, 0];
        
        // 14 Detailed Component Pieces (All target Z=0 to avoid perspective drift perfectly!)
        const layersData = [
            // 1. Base Site Viewport (Back layer, Render Order 1)
            { mesh: createLayer(8, 5, colors.background, [-2, -2, -8], [-0.5, 0.4, 0.2], 0.3, 1), target: [0, 0, 0], rot: finalRot },
            
            // 2. Header Bar (Mid layer, Render Order 2)
            { mesh: createLayer(7.6, 0.6, colors.card, [0, 4, -5], [-0.2, -0.6, -0.1], 0.6, 2), target: [0, 2.1, 0], rot: finalRot },
            
            // 3. Header Logo (Front layer, Render Order 3)
            { mesh: createLayer(0.8, 0.2, colors.text, [-5, 3, -2], [0.3, 0.1, -0.2], 0.8, 3), target: [-3.2, 2.1, 0], rot: finalRot },
            
            // 4. Header Nav Links (Front layer)
            { mesh: createLayer(0.4, 0.05, colors.text, [3, 5, -8], [-0.4, 0.5, 0.1], 0.6, 3), target: [1.2, 2.1, 0], rot: finalRot },
            { mesh: createLayer(0.4, 0.05, colors.text, [4, 6, -10], [-0.5, 0.6, 0.2], 0.6, 3), target: [1.8, 2.1, 0], rot: finalRot },
            { mesh: createLayer(0.4, 0.05, colors.text, [5, 4, -7], [-0.3, 0.4, 0.1], 0.6, 3), target: [2.4, 2.1, 0], rot: finalRot },
            
            // 5. Header CTA Button (Front layer)
            { mesh: createLayer(0.8, 0.3, colors.accent, [6, 2, -6], [0.2, -0.3, 0.5], 0.9, 3), target: [3.2, 2.1, 0], rot: finalRot },
            
            // 6. Hero Image / Video Box (Mid layer)
            { mesh: createLayer(3.2, 3.4, colors.card, [5, -3, -10], [0.4, -0.5, -0.3], 0.5, 2), target: [1.8, -0.1, 0], rot: finalRot },
            
            // 7. Hero Title Lines (Front layer)
            { mesh: createLayer(2.8, 0.4, colors.text, [-6, -1, -5], [0.2, 0.5, -0.2], 0.8, 3), target: [-2.0, 0.8, 0], rot: finalRot },
            { mesh: createLayer(1.8, 0.4, colors.text, [-5, -2, -4], [0.3, 0.4, -0.1], 0.8, 3), target: [-2.5, 0.2, 0], rot: finalRot },
            
            // 8. Hero Paragraph Lines (Front layer)
            { mesh: createLayer(2.8, 0.1, colors.text, [-4, -3, -6], [0.1, 0.2, 0.1], 0.5, 3), target: [-2.0, -0.4, 0], rot: finalRot },
            { mesh: createLayer(2.4, 0.1, colors.text, [-3, -4, -5], [0.2, 0.1, 0.2], 0.5, 3), target: [-2.2, -0.6, 0], rot: finalRot },
            { mesh: createLayer(2.0, 0.1, colors.text, [-2, -5, -4], [0.1, 0.3, 0.3], 0.5, 3), target: [-2.4, -0.8, 0], rot: finalRot },
            
            // 9. Hero Main Button (Front layer)
            { mesh: createLayer(1.2, 0.4, colors.accent, [-5, -6, -2], [-0.2, 0.5, 0.4], 0.9, 3), target: [-2.8, -1.4, 0], rot: finalRot }
        ];

        // Store initial values manually as clones
        layersData.forEach(l => {
            l.mesh.userData.startPos = l.mesh.position.clone();
            l.mesh.userData.startRot = l.mesh.rotation.clone();
        });

        const updateResponsiveUI = () => {
            if (window.innerWidth < 1024) {
                uiGroup.position.set(2, -1, 0); // Tablet
                uiGroup.scale.set(0.8, 0.8, 0.8);
            } else {
                uiGroup.position.set(3, 0, 0); // Desktop standard (Right side)
                uiGroup.scale.set(1, 1, 1);
            }
        };
        updateResponsiveUI();

        // GSAP Scroll Animation
        gsap.to({}, {
            scrollTrigger: {
                trigger: "#hero",
                start: "top top",
                end: "bottom bottom",
                scrub: 1.5,
                onUpdate: (self) => {
                    const p = self.progress;
                    layersData.forEach(l => {
                        l.mesh.position.x = l.mesh.userData.startPos.x + (l.target[0] - l.mesh.userData.startPos.x) * p;
                        l.mesh.position.y = l.mesh.userData.startPos.y + (l.target[1] - l.mesh.userData.startPos.y) * p;
                        l.mesh.position.z = l.mesh.userData.startPos.z + (l.target[2] - l.mesh.userData.startPos.z) * p;
                        
                        l.mesh.rotation.x = l.mesh.userData.startRot.x + (l.rot[0] - l.mesh.userData.startRot.x) * p;
                        l.mesh.rotation.y = l.mesh.userData.startRot.y + (l.rot[1] - l.mesh.userData.startRot.y) * p;
                        l.mesh.rotation.z = l.mesh.userData.startRot.z + (l.rot[2] - l.mesh.userData.startRot.z) * p;
                    });
                }
            }
        });

        // Animation Loop (Floating Effect)
        const clock = new THREE.Clock();
        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            const p = ScrollTrigger.getById('hero-trigger-main')?.progress || 0;
            
            layersData.forEach((l, i) => {
                const intensity = (1 - p) * 0.4;
                l.mesh.position.y += Math.sin(elapsedTime * 0.8 + i) * intensity * 0.005;
                l.mesh.rotation.z += Math.cos(elapsedTime * 0.5 + i) * intensity * 0.003;
            });

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        ScrollTrigger.create({
            id: 'hero-trigger-main',
            trigger: "#hero",
            start: "top top",
            end: "bottom bottom"
        });

        animate();

        // Resize
        window.addEventListener('resize', () => {
            if (window.innerWidth < 768) {
                canvas.style.display = 'none';
            } else {
                canvas.style.display = 'block';
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                updateResponsiveUI(); // dynamically recalculate center/scale
            }
        });
    };

    setupThreeJS();
    
    // 6. Custom Mouse Cursor & Jet Trail Effect (Canvas-based)
    const setupCursor = () => {
        const cursor = document.getElementById('custom-cursor');
        const canvas = document.getElementById('cursor-trail-canvas');
        
        if (!cursor || !canvas || window.innerWidth < 1024) return;
        
        const ctx = canvas.getContext('2d');
        let points = [];
        const maxPoints = 25; // Length of the jet trail
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let mouse = { x: 0, y: 0 };
        let isMoving = false;

        // Position tracking
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            isMoving = true;
            
            gsap.set(cursor, { x: mouse.x, y: mouse.y });
            
            // Add point to trail
            points.push({ 
                x: mouse.x, 
                y: mouse.y, 
                age: 0,
                vx: (Math.random() - 0.5) * 0.5, // Subtle lateral dispersion
                vy: (Math.random() - 0.5) * 0.5
            });
            
            if (points.length > maxPoints) {
                points.shift();
            }
        });

        // Loop animation
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (points.length > 1) {
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                
                for (let i = 1; i < points.length; i++) {
                    const p = points[i];
                    const prevP = points[i-1];
                    
                    // Bezier curves for smoother trail
                    const xc = (p.x + prevP.x) / 2;
                    const yc = (p.y + prevP.y) / 2;
                    ctx.quadraticCurveTo(prevP.x, prevP.y, xc, yc);
                    
                    // Update point (drifting)
                    p.x += p.vx;
                    p.y += p.vy;
                    p.age++;
                }
                
                // Styling the Contrail
                const gradient = ctx.createLinearGradient(
                    points[0].x, points[0].y, 
                    points[points.length-1].x, points[points.length-1].y
                );
                
                const accentColor = '#42e5b0';
                ctx.shadowBlur = 15;
                ctx.shadowColor = accentColor;
                ctx.strokeStyle = accentColor;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                // Draw based on distance
                for(let i = 0; i < points.length - 1; i++){
                    const alpha = (i / points.length) * 0.8;
                    const width = (i / points.length) * 8;
                    
                    ctx.beginPath();
                    ctx.globalAlpha = alpha;
                    ctx.lineWidth = width;
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(points[i+1].x, points[i+1].y);
                    ctx.stroke();
                }
            }

            // Always slowly shift points even if not moving to give "life"
            if (points.length > 0 && !isMoving) {
                // Decay trail when idle
                // points.shift(); // Optional: remove this if you want it to stay until moved again
            }
            
            requestAnimationFrame(animate);
        };
        animate();

        // Interactions for Clickable elements
        const hoverables = document.querySelectorAll('a, button, .portfolio-item, .faq-item, .card');
        
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, {
                    scale: 3,
                    backgroundColor: '#fff',
                    duration: 0.3
                });
            });
            
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, {
                    scale: 1,
                    backgroundColor: '#42e5b0',
                    duration: 0.3
                });
            });
        });
    }

    if (window.innerWidth >= 1024) {
        setupCursor();
    }

    // 7. Content Protection (Premium Detterents)
    const protectContent = () => {
        // Disable Right Click
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Disable Copy Command
        document.addEventListener('copy', (e) => {
            e.preventDefault();
            return false;
        });

        // Disable Common Developer & Copy Shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+C, Ctrl+V, Ctrl+U (Source), Ctrl+S, Ctrl+P, F12 (DevTools)
            if (
                e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'u' || e.key === 's' || e.key === 'p' || e.key === 'a') || 
                e.key === 'F12'
            ) {
                e.preventDefault();
                return false;
            }
        });
    };
    protectContent();

    // 8. Magnetic Buttons (Developer Aesthetic)
    const setupMagneticButtons = () => {
        if (window.innerWidth < 1024) return;
        
        const magnets = document.querySelectorAll('.magnet-btn');
        
        magnets.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                // Move button slightly towards mouse
                gsap.to(btn, {
                    x: x * 0.4,
                    y: y * 0.4,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Move text inside even further for parallax
                const text = btn.querySelector('.btn-text');
                if (text) {
                    gsap.to(text, {
                        x: x * 0.2,
                        y: y * 0.2,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });
            
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
                const text = btn.querySelector('.btn-text');
                if (text) {
                    gsap.to(text, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
                }
            });
        });
    };
    setupMagneticButtons();

    // 9. Text Scramble Effect (Hacker / Console vibe)
    const setupTextScramble = () => {
        class TextScramble {
            constructor(el) {
                this.el = el;
                this.chars = '!<>-_\\\\/[]{}—=+*^?#________';
                this.update = this.update.bind(this);
            }
            
            setText(newText) {
                const oldText = this.el.innerText;
                const length = Math.max(oldText.length, newText.length);
                const promise = new Promise((resolve) => this.resolve = resolve);
                this.queue = [];
                for (let i = 0; i < length; i++) {
                    const from = oldText[i] || '';
                    const to = newText[i] || '';
                    const start = Math.floor(Math.random() * 40);
                    const end = start + Math.floor(Math.random() * 40);
                    this.queue.push({ from, to, start, end });
                }
                cancelAnimationFrame(this.frameRequest);
                this.frame = 0;
                this.update();
                return promise;
            }
            
            update() {
                let output = '';
                let complete = 0;
                for (let i = 0, n = this.queue.length; i < n; i++) {
                    let { from, to, start, end, char } = this.queue[i];
                    if (this.frame >= end) {
                        complete++;
                        output += to;
                    } else if (this.frame >= start) {
                        if (!char || Math.random() < 0.28) {
                            char = this.randomChar();
                            this.queue[i].char = char;
                        }
                        output += `<span class="opacity-50">${char}</span>`;
                    } else {
                        output += from;
                    }
                }
                this.el.innerHTML = output;
                if (complete === this.queue.length) {
                    this.resolve();
                } else {
                    this.frameRequest = requestAnimationFrame(this.update);
                    this.frame++;
                }
            }
            
            randomChar() {
                return this.chars[Math.floor(Math.random() * this.chars.length)];
            }
        }

        const scrambleBtns = document.querySelectorAll('.scramble-hover');
        scrambleBtns.forEach(btn => {
            const textEl = btn.querySelector('.btn-text') || btn;
            const fx = new TextScramble(textEl);
            const originalText = textEl.getAttribute('data-text') || textEl.innerText;
            textEl.setAttribute('data-text', originalText); // Store original
            
            let isAnimating = false;
            
            btn.addEventListener('mouseenter', () => {
                if(isAnimating) return;
                isAnimating = true;
                fx.setText(originalText).then(() => {
                    isAnimating = false;
                });
            });
        });
    };
    setupTextScramble();
    
    // 10. Process Section Animation (Progress Line & Markers)
    const setupProcessAnimation = () => {
        const processLine = document.getElementById('process-progress-line');
        const steps = document.querySelectorAll('.step');
        
        if (!processLine || steps.length === 0) return;

        // Animate the progress line as the user scrolls through the section
        gsap.to(processLine, {
            width: "100%",
            ease: "none",
            scrollTrigger: {
                trigger: ".process-steps",
                start: "top 80%",
                end: "bottom 20%",
                scrub: 0.5
            }
        });

        // Toggle active class for each step when it reaches the viewport center
        steps.forEach((step) => {
            ScrollTrigger.create({
                trigger: step,
                start: "top 70%",
                onEnter: () => step.classList.add('active'),
                onLeaveBack: () => step.classList.remove('active')
            });
        });
    };
    setupProcessAnimation();

    setupProcessAnimation();

    // 12. FAQ Accordion Animation
    const setupFAQAnimation = () => {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            item.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Toggle clicked item
                item.classList.toggle('active');
                
                // Optional: Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
            });
        });
    };
    setupFAQAnimation();

    // 13. Portfolio Section Animations (Filtering & Interactivity)
    const setupPortfolioAnimations = () => {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projects = document.querySelectorAll('.portfolio-item');
        const emptyMsg = document.getElementById('no-projects-msg');
        
        if (!filterBtns.length || !projects.length) return;

        // --- Category Filtering ---
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                let visibleCount = 0;
                
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Filter items
                projects.forEach(project => {
                    const category = project.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        visibleCount++;
                        project.classList.remove('filtered-out');
                        gsap.to(project, {
                            opacity: 1,
                            scale: 1,
                            duration: 0.6,
                            ease: "power2.out",
                            clearProps: "all"
                        });
                    } else {
                        project.classList.add('filtered-out');
                        gsap.to(project, {
                            opacity: 0,
                            scale: 0.9,
                            duration: 0.6,
                            ease: "power2.inOut"
                        });
                    }
                });

                // Show/Hide Empty Message
                if (emptyMsg) {
                    if (visibleCount === 0) {
                        emptyMsg.style.display = 'block';
                        gsap.fromTo(emptyMsg, { opacity: 0, y: 10 }, { 
                            opacity: 1, 
                            y: 0, 
                            duration: 0.6,
                            delay: 0.2 // Bit of delay for flow
                        });
                    } else {
                        emptyMsg.style.display = 'none';
                    }
                }
            });
        });
    };
    setupPortfolioAnimations();

    // 5. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileClose = document.getElementById('mobile-close');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const body = document.body;

    if (mobileToggle && mobileOverlay) {
        const toggleMenu = () => {
            mobileToggle.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            body.style.overflow = mobileOverlay.classList.contains('active') ? 'hidden' : '';
        };
        
        const closeMenu = () => {
            mobileToggle.classList.remove('active');
            mobileOverlay.classList.remove('active');
            body.style.overflow = '';
        };

        mobileToggle.addEventListener('click', toggleMenu);
        if (mobileClose) {
            mobileClose.addEventListener('click', closeMenu);
        }

        // Close menu on link click
        mobileOverlay.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // 14. Policy Modal Logic (Privacy, Terms, Cookies)
    if (document.getElementById('policy-modal')) {
        const modal = document.getElementById('policy-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const closeBtn = document.getElementById('modal-close');
        const triggerBtns = document.querySelectorAll('.open-policy');

        const policies = {
            privacy: {
                title: "Política de Privacidade",
                content: `
                    <p>Esta Política de Privacidade descreve como suas informações pessoais são coletadas, usadas e compartilhadas quando você visita o site de Gregory Padilha.</p>
                    
                    <h3>1. Coleta de Informações</h3>
                    <p>Coletamos informações que você nos fornece diretamente ao entrar em contato conosco via WhatsApp ou e-mail, como seu nome e número de telefone. Além disso, coletamos automaticamente certas informações sobre o seu dispositivo através de cookies e tecnologias semelhantes.</p>
                    
                    <h3>2. Uso das Informações</h3>
                    <p>Usamos as informações coletadas para:</p>
                    <ul>
                        <li>Fornecer e manter nossos serviços;</li>
                        <li>Notificar sobre alterações em nossos projetos;</li>
                        <li>Fornecer suporte ao cliente;</li>
                        <li>Monitorar o uso do nosso site para melhorias de performance e design.</li>
                    </ul>
                    
                    <h3>3. Segurança</h3>
                    <p>A segurança dos seus dados é importante para nós. Utilizamos métodos de proteção modernos para garantir que suas informações estejam seguras contra acesso não autorizado.</p>
                    
                    <h3>4. Seus Direitos (LGPD)</h3>
                    <p>Conforme a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento. Entre em contato conosco para exercer esses direitos.</p>
                `
            },
            terms: {
                title: "Termos de Serviço",
                content: `
                    <p>Ao acessar o site de Gregory Padilha, você concorda em cumprir estes termos de serviço e todas as leis e regulamentos aplicáveis.</p>
                    
                    <h3>1. Uso de Licença</h3>
                    <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site apenas para visualização transitória pessoal e não comercial.</p>
                    
                    <h3>2. Isenção de Responsabilidade</h3>
                    <p>Os materiais no site de Gregory Padilha são fornecidos 'como estão'. Não oferecemos garantias, expressas ou implícitas, e por este meio, isentamos e negamos todas as outras garantias.</p>
                    
                    <h3>3. Limitações</h3>
                    <p>Em nenhum caso Gregory Padilha ou seus fornecedores serão responsáveis por quaisquer danos decorrentes do uso ou da incapacidade de usar os materiais em nosso site.</p>
                    
                    <h3>4. Propriedade Intelectual</h3>
                    <p>O design, código e artes apresentados neste portfólio são de propriedade de Gregory Padilha ou de seus respectivos clientes, não sendo permitida a reprodução sem autorização prévia.</p>
                `
            },
            cookies: {
                title: "Política de Cookies",
                content: `
                    <p>Utilizamos cookies para melhorar sua experiência em nosso site e entender como você interage com nossos conteúdos.</p>
                    
                    <h3>1. O que são cookies?</h3>
                    <p>Cookies são pequenos arquivos de texto enviados pelo site ao seu navegador, que ajudam a lembrar informações sobre sua visita.</p>
                    
                    <h3>2. Como usamos?</h3>
                    <p>Utilizamos cookies de performance (como Google Analytics) para entender o tráfego do site e cookies de marketing (como Meta Pixel) para otimizar nossas campanhas de anúncios.</p>
                    
                    <h3>3. Como gerenciar?</h3>
                    <p>Você pode configurar seu navegador para recusar todos os cookies ou para indicar quando um cookie está sendo enviado. No entanto, algumas partes do nosso site podem não funcionar corretamente sem eles.</p>
                `
            }
        };

        const openModal = (type) => {
            const policy = policies[type];
            if (policy) {
                modalTitle.innerText = policy.title;
                modalContent.innerHTML = policy.content;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scroll
            }
        };

        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };

        triggerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.getAttribute('data-policy');
                openModal(type);
            });
        });

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
        });
    }
});

