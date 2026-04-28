(function () {
  const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);
  if (isMobile) {
    const el = document.getElementById('vs-splash');
    if (el) el.remove();
    return;
  }

  // Site background: #F5F5F7 = rgb(245, 245, 247)
  const BG_R = 245, BG_G = 245, BG_B = 247;

  class Vector2D {
    constructor(x, y) { this.x = x; this.y = y; }
  }
  class Vector3D {
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  }

  class Star {
    constructor(cameraZ, cameraTravelDistance) {
      this.angle = Math.random() * Math.PI * 2;
      this.distance = 40 * Math.random() + 20;
      this.rotationDirection = Math.random() > 0.5 ? 1 : -1;
      this.expansionRate = 1.5 + Math.random() * 1.2;
      this.finalScale = 0.7 + Math.random() * 0.6;
      this.dx = this.distance * Math.cos(this.angle);
      this.dy = this.distance * Math.sin(this.angle);
      this.spiralLocation = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3;
      const minZ = 0.5 * cameraZ, maxZ = cameraTravelDistance + cameraZ;
      this.z = minZ + Math.random() * (maxZ - minZ);
      const lerp = (s, e, t) => s * (1 - t) + e * t;
      this.z = lerp(this.z, cameraTravelDistance / 2, 0.3 * this.spiralLocation);
      this.strokeWeightFactor = 0.3 + Math.pow(Math.random(), 1.2) * 0.7;
    }

    render(p, c) {
      const spiralPos = c.spiralPath(this.spiralLocation);
      const q = p - this.spiralLocation;
      if (q <= 0) return;

      const dp = c.constrain(4 * q, 0, 1);
      const elastic = c.easeOutElastic(dp);
      const power = Math.pow(dp, 2);

      let easing;
      if (dp < 0.3)      easing = c.lerp(dp, power, dp / 0.3);
      else if (dp < 0.7) easing = c.lerp(power, elastic, (dp - 0.3) / 0.4);
      else               easing = elastic;

      let sx, sy;
      if (dp < 0.3) {
        sx = c.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, easing / 0.3);
        sy = c.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, easing / 0.3);
      } else if (dp < 0.7) {
        const mid = (dp - 0.3) / 0.4;
        const curve = Math.sin(mid * Math.PI) * this.rotationDirection * 1.5;
        const bx = spiralPos.x + this.dx * 0.3, by = spiralPos.y + this.dy * 0.3;
        const tx = spiralPos.x + this.dx * 0.7, ty = spiralPos.y + this.dy * 0.7;
        sx = c.lerp(bx, tx, mid) + (-this.dy * 0.4 * curve) * mid;
        sy = c.lerp(by, ty, mid) + (this.dx * 0.4 * curve) * mid;
      } else {
        const fp = (dp - 0.7) / 0.3;
        const bx = spiralPos.x + this.dx * 0.7, by = spiralPos.y + this.dy * 0.7;
        const td = this.distance * this.expansionRate * 2.0;
        const sa = this.angle + 1.2 * this.rotationDirection * fp * Math.PI;
        sx = c.lerp(bx, spiralPos.x + td * Math.cos(sa), fp);
        sy = c.lerp(by, spiralPos.y + td * Math.sin(sa), fp);
      }

      const vx = (this.z - c.cameraZ) * sx / c.viewZoom;
      const vy = (this.z - c.cameraZ) * sy / c.viewZoom;

      let size;
      if (dp < 0.6) size = 1.0 + dp * 0.2;
      else          size = c.lerp(1.2, this.finalScale, (dp - 0.6) / 0.4);

      c.showProjectedDot(new Vector3D(vx, vy, this.z), 8.5 * this.strokeWeightFactor * size);
    }
  }

  class AnimationController {
    constructor(canvas, ctx, dpr, size) {
      this.canvas = canvas; this.ctx = ctx; this.dpr = dpr; this.size = size;
      this.time = 0; this.stars = [];
      this.changeEventTime = 0.32; this.cameraZ = -400;
      this.cameraTravelDistance = 3400; this.startDotYOffset = 28;
      this.viewZoom = 100; this.trailLength = isMobile ? 40 : 80;

      // Burst state (animated by GSAP on dismiss)
      this.bgProgress  = 0; // 0 = black, 1 = site bg (#F5F5F7)
      this.expandScale = 1; // canvas zoom multiplier

      // Seeded stars for deterministic core
      const orig = Math.random; let seed = 1234;
      Math.random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      const starCount = isMobile ? 5000 : 20000;
      for (let i = 0; i < starCount; i++) this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance));
      Math.random = orig;
      for (let i = 0; i < starCount; i++) this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance));


      this.startTime = Date.now();
      this.textParticles = [];
      // Init particles after fonts load so Inter renders correctly
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => this.initTextParticles());

      this.tween = gsap.to(this, {
        time: 1, duration: 5, repeat: -1, ease: 'none',
        onUpdate: () => this.render()
      });
    }

    initTextParticles() {
      const fontSize = isMobile ? 28 : 44;
      const cw = 620, ch = 110;
      const oc = document.createElement('canvas');
      oc.width = cw; oc.height = ch;
      const ox = oc.getContext('2d');
      ox.font = `800 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
      ox.textAlign = 'center';
      ox.textBaseline = 'middle';
      ox.fillStyle = 'white';
      ox.fillText('Vantage Studios', cw / 2, ch / 2);
      const data = ox.getImageData(0, 0, cw, ch).data;
      const step = isMobile ? 3 : 2;
      this.textParticles = [];
      for (let y = 0; y < ch; y += step) {
        for (let x = 0; x < cw; x += step) {
          if (data[(y * cw + x) * 4 + 3] > 100) {
            const outAngle = Math.random() * Math.PI * 2;
            const inAngle  = Math.random() * Math.PI * 2;
            const inDist   = 20 + Math.random() * 180; // start near spiral center
            this.textParticles.push({
              x: x - cw / 2,   // target (text) position
              y: y - ch / 2,
              sx: Math.cos(inAngle) * inDist, // start scattered near center
              sy: Math.sin(inAngle) * inDist,
              vx: Math.cos(outAngle) * (60 + Math.random() * 160), // burst direction
              vy: Math.sin(outAngle) * (60 + Math.random() * 160),
              size: 0.7 + Math.random() * 1.3,
              phase: Math.random() * Math.PI * 2,
              speed: 2 + Math.random() * 5,
            });
          }
        }
      }
    }

    ease(p, g) { return p < 0.5 ? 0.5 * Math.pow(2*p,g) : 1 - 0.5 * Math.pow(2*(1-p),g); }
    easeOutElastic(x) {
      if (x<=0) return 0; if (x>=1) return 1;
      return Math.pow(2,-8*x) * Math.sin((x*8-0.75)*(2*Math.PI/4.5)) + 1;
    }
    map(v,s1,e1,s2,e2) { return s2+(e2-s2)*((v-s1)/(e1-s1)); }
    constrain(v,mn,mx) { return Math.min(Math.max(v,mn),mx); }
    lerp(s,e,t) { return s*(1-t)+e*t; }

    spiralPath(p) {
      p = this.constrain(1.2*p,0,1); p = this.ease(p,1.8);
      const theta = 2*Math.PI*6*Math.sqrt(p), r = 170*Math.sqrt(p);
      return new Vector2D(r*Math.cos(theta), r*Math.sin(theta)+this.startDotYOffset);
    }

    rotate(v1,v2,p,orientation) {
      const mx=(v1.x+v2.x)/2, my=(v1.y+v2.y)/2;
      const dx=v1.x-mx, dy=v1.y-my;
      const angle=Math.atan2(dy,dx), o=orientation?-1:1;
      const r=Math.sqrt(dx*dx+dy*dy), bounce=Math.sin(p*Math.PI)*0.05*(1-p);
      const el=this.easeOutElastic(p);
      return new Vector2D(mx+r*(1+bounce)*Math.cos(angle+o*Math.PI*el), my+r*(1+bounce)*Math.sin(angle+o*Math.PI*el));
    }

    showProjectedDot(pos, sizeFactor) {
      const t2=this.constrain(this.map(this.time,this.changeEventTime,1,0,1),0,1);
      const camZ=this.cameraZ+this.ease(Math.pow(t2,1.2),1.8)*this.cameraTravelDistance;
      if (pos.z<=camZ) return;
      const depth=pos.z-camZ;
      this.ctx.lineWidth=400*sizeFactor/depth;
      this.ctx.beginPath();
      this.ctx.arc(this.viewZoom*pos.x/depth, this.viewZoom*pos.y/depth, 0.5, 0, Math.PI*2);
      this.ctx.fill();
    }

    render() {
      const ctx = this.ctx;
      const bp = this.bgProgress;

      // Background: interpolate black → site background color
      const r = Math.round(bp * BG_R);
      const g = Math.round(bp * BG_G);
      const b = Math.round(bp * BG_B);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, this.size, this.size);

      const globalScale = isMobile ? 1.0 : 1.25;
      ctx.save();
      ctx.translate(this.size/2, this.size/2);
      ctx.scale(this.expandScale * globalScale, this.expandScale * globalScale);

      const t1=this.constrain(this.map(this.time,0,this.changeEventTime+0.25,0,1),0,1);
      const t2=this.constrain(this.map(this.time,this.changeEventTime,1,0,1),0,1);
      ctx.rotate(-Math.PI*this.ease(t2,2.7));

      // Star color: white → site background (they dissolve into the bg)
      const starR = Math.round(255 - bp * (255 - BG_R));
      const starG = Math.round(255 - bp * (255 - BG_G));
      const starB = Math.round(255 - bp * (255 - BG_B));
      const starColor = `rgb(${starR},${starG},${starB})`;

      // Trail
      for (let i=0; i<this.trailLength; i++) {
        const f=this.map(i,0,this.trailLength,1.1,0.1);
        const sw=(1.3*(1-t1)+3.0*Math.sin(Math.PI*t1))*f;
        ctx.fillStyle = starColor;
        ctx.lineWidth=sw;
        const pos=this.spiralPath(t1-0.00015*i);
        const rot=this.rotate(pos, new Vector2D(pos.x+5,pos.y+5), Math.sin(this.time*Math.PI*2)*0.5+0.5, i%2===0);
        ctx.beginPath(); ctx.arc(rot.x,rot.y,sw/2,0,Math.PI*2); ctx.fill();
      }

      ctx.fillStyle = starColor;
      for (const star of this.stars) star.render(t1, this);

      if (this.time > this.changeEventTime) {
        const dy=this.cameraZ*this.startDotYOffset/this.viewZoom;
        this.showProjectedDot(new Vector3D(0,dy,this.cameraTravelDistance),2.5);
      }
      ctx.restore();

      // Vantage Studios — blue sparkle particles sampled from text shape
      const elapsed = (Date.now() - this.startTime) / 1000;
      const burstTotal = isMobile ? 2.5 : 3.0;
      const textAlpha = this.constrain(this.map(elapsed, 0.8, 2.2, 0, 1), 0, 1)
                      * (1 - Math.pow(this.bgProgress, 2));
      if (textAlpha > 0 && this.textParticles.length > 0) {
        const baseScale = 0.7 + Math.max(0, elapsed - 0.8) * 0.25;
        const totalScale = baseScale + this.bgProgress * 8;
        const burst = this.bgProgress * 2.2;
        ctx.save();
        ctx.translate(this.size / 2, this.size / 2);
        for (const p of this.textParticles) {
          const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(elapsed * p.speed + p.phase));
          const px = (p.x + p.vx * burst) * totalScale * globalScale;
          const py = (p.y + p.vy * burst) * totalScale * globalScale;
          const r = p.size * (1 + this.bgProgress * 1.5);
          ctx.globalAlpha = textAlpha * twinkle;
          ctx.fillStyle = '#007AFF';
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    burst(onComplete) {
      gsap.to(this, {
        bgProgress: 1,
        expandScale: 4,
        duration: 1.3,
        ease: 'power1.inOut',
        onComplete
      });
    }

    destroy() { this.tween.kill(); }
  }

  function init() {
    const overlay = document.getElementById('vs-splash');
    const canvas  = document.getElementById('vs-splash-canvas');
    if (!overlay || !canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x — 3x kills mobile

    function resize() {
      const w=window.innerWidth, h=window.innerHeight, size=Math.max(w,h);
      canvas.width=size*dpr; canvas.height=size*dpr;
      canvas.style.width=w+'px'; canvas.style.height=h+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener('resize', resize);

    const controller = new AnimationController(canvas, ctx, dpr, Math.max(window.innerWidth, window.innerHeight));

    // Auto-burst: faster on mobile
    const burstDelay = isMobile ? 2500 : 3000;
    setTimeout(() => {
      controller.burst(() => {
        // Stars have filled screen with site bg color — fade overlay out
        overlay.style.transition = 'opacity 0.35s ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          controller.destroy();
          window.removeEventListener('resize', resize);
        }, 350);
      });
    }, burstDelay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
