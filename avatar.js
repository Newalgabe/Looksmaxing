/**
 * avatar.js
 * Renders a dynamic, high-fidelity realistic digital portrait of the subject
 * on an HTML5 canvas based on physical, styling, and botched clinical stats.
 * Uses advanced canvas gradients, drop shadows, path blending, and hair strand loops.
 */

// Offscreen grid cache
let _gridCache = null;
let _gridW = 0;
let _gridH = 0;

export function drawAvatar(canvas, stats, timeMs = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Normalize stats
  const gender = stats.gender || 'male';
  const heightVal = stats.height || 68; // in inches
  const jawType = stats.jaw || 'Average'; // Receding, Soft, Average, Sharp, Chiseled
  const tiltType = stats.tilt || 'Neutral'; // Negative, Neutral, Positive
  const hairline = stats.hairline || 2; // Norwood/Ludwig
  const skinVal = stats.skin || 50; // 0-100
  const frameVal = stats.frame || 50; // 0-100
  const styleVal = stats.style || 30; // 0-100
  const symmetry = stats.symmetry || 'Average';
  const confidence = stats.confidence || 50;
  const rizz = stats.rizz || 50;

  // Draw background cyber-biometric scan grid (cached)
  if (!_gridCache || _gridW !== w || _gridH !== h) {
    _gridW = w; _gridH = h;
    _gridCache = document.createElement('canvas');
    _gridCache.width = w;
    _gridCache.height = h;
    const gctx = _gridCache.getContext('2d');
    drawBackgroundGrid(gctx, w, h);
  }
  ctx.drawImage(_gridCache, 0, 0);

  // Base positioning configurations
  const centerX = w / 2;
  const centerY = h / 2 - 10;
  
  // Sizing based on Frame stat
  let shoulderWidth = 115 + (frameVal / 100) * 85; // 115 to 200
  let neckWidth = 26 + (frameVal / 100) * 22; // 26 to 48
  if (gender === 'female') {
    shoulderWidth = 90 + (frameVal / 100) * 60; // 90 to 150
    neckWidth = 20 + (frameVal / 100) * 14; // 20 to 34
  }
  
  // Asymmetry offsets (simulates biological/botched asymmetry)
  let asymmetryOffset = 0;
  if (symmetry === 'Asymmetrical') {
    asymmetryOffset = 5;
  }

  // Animation offset: breathing cycle shifts the neck and head coordinates
  const breathingOffset = Math.sin(timeMs * 0.0025) * 1.8;
  const headY = centerY + breathingOffset;

  // 1. Draw Back Hair (for female/long hair, drawn behind shoulders and ears)
  drawBackHair(ctx, centerX, headY - 45, hairline, gender);

  // 2. Draw Body & Outfits (Wrinkled texture, styles & shading)
  drawShoulders(ctx, centerX, centerY + 85, shoulderWidth, styleVal, gender);

  // 3. Draw Neck (attaches shoulders to moving head, soft shadow overlays)
  drawNeck(ctx, centerX, headY + 20, neckWidth, centerY + 85);

  // 4. Draw Face Shape (influenced by Jaw type, gender, symmetry, and botched jaw)
  drawHead(ctx, centerX, headY, jawType, asymmetryOffset, stats.botchedJaw, gender);

  // 5. Draw Skin details (smoothness, blemishes, specularity)
  drawSkinFeatures(ctx, centerX, headY, skinVal);

  // 6. Draw Eyes (almond shaped, tear ducts, detailed iris, highlights, lashes, blink cycle)
  drawEyes(ctx, centerX, headY - 10, tiltType, asymmetryOffset, timeMs, stats.botchedCanthoplasty, gender, styleVal, stats.name);

  // 7. Draw Face Details (Nose highlights, sculpted eyebrows, lips & lipstick)
  drawFacialFeatures(ctx, centerX, headY, confidence, gender, styleVal);

  // 8. Draw Front Hair & Hairlines (Norwood/Ludwig strands, transplants)
  drawHair(ctx, centerX, headY - 45, hairline, stats.botchedHair, gender);
  
  // 9. Draw Accessories (Sunglasses glare, metallic chain necklace, headphones glow)
  drawAccessories(ctx, centerX, headY, styleVal, gender, timeMs);
  
  // 10. Draw Height Indicator Scale on side
  drawHeightIndicator(ctx, w, h, heightVal);

  // 11. Biometric Scan UI Overlay HUD
  drawClinicalHUD(ctx, w, h, stats);
}

// Background Grid with telemetry markers
function drawBackgroundGrid(ctx, w, h) {
  // Rich deep tech gradient
  const grad = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, w);
  grad.addColorStop(0, '#0c0d12');
  grad.addColorStop(1, '#040507');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Soft grid lines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
  ctx.lineWidth = 1;
  const step = 20;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw grid dot intersections
  ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
  for (let x = step; x < w; x += step * 2) {
    for (let y = step; y < h; y += step * 2) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  // Faint scan rings in the background
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(w/2, h/2 - 10, 110, 0, Math.PI*2);
  ctx.arc(w/2, h/2 - 10, 160, 0, Math.PI*2);
  ctx.stroke();

  // Biometric crosshairs
  ctx.strokeStyle = 'rgba(255, 0, 127, 0.1)';
  ctx.lineWidth = 1;
  // Center crosshair
  ctx.beginPath();
  ctx.moveTo(w/2 - 15, h/2 - 10);
  ctx.lineTo(w/2 + 15, h/2 - 10);
  ctx.moveTo(w/2, h/2 - 25);
  ctx.lineTo(w/2, h/2 + 5);
  ctx.stroke();
}

function drawShoulders(ctx, cx, cy, width, styleScore, gender = 'male') {
  ctx.save();
  
  // Setup organic fabric shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  let outfit = {
    base: '#2b231c', // Ripped shirt brown
    accent: '#47392d',
    neon: 'transparent',
    hasTie: false,
    folds: 'rgba(0,0,0,0.25)',
    type: 'ripped'
  };

  if (styleScore >= 80) {
    outfit = {
      base: '#0f1115', // Sleek luxury suit charcoal
      accent: '#ffffff', // crisp white shirt
      neon: '#ffcc00', // gold pin
      hasTie: true,
      folds: 'rgba(0,0,0,0.4)',
      type: 'suit'
    };
  } else if (styleScore >= 60) {
    outfit = {
      base: '#141417', // Cyber techwear black
      accent: '#212529',
      neon: '#ff007f', // hot pink glowing trims
      hasTie: false,
      folds: 'rgba(0,240,255,0.1)',
      type: 'techwear'
    };
  } else if (styleScore >= 30) {
    outfit = {
      base: '#383d47', // Streetwear hoodie grey
      accent: '#5a6270',
      neon: '#00f0ff', // cyan drawstring glow
      hasTie: false,
      folds: 'rgba(0,0,0,0.15)',
      type: 'streetwear'
    };
  }

  // Draw Shoulders (slightly tapered & naturally rounded)
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, cy + 120);
  // Left shoulder curve
  ctx.quadraticCurveTo(cx - width / 2 + 12, cy + 15, cx - 18, cy + 5);
  ctx.lineTo(cx + 18, cy + 5);
  // Right shoulder curve
  ctx.quadraticCurveTo(cx + width / 2 - 12, cy + 15, cx + width / 2, cy + 120);
  ctx.closePath();

  // Gradient fill for cloth depth
  const shGrad = ctx.createLinearGradient(cx - width/2, cy, cx + width/2, cy + 100);
  shGrad.addColorStop(0, outfit.base);
  shGrad.addColorStop(1, adjustColorBrightness(outfit.base, -20));
  ctx.fillStyle = shGrad;
  ctx.fill();

  ctx.shadowColor = 'transparent'; // Reset shadows

  // Outlined sketch overlay for fabric boundary
  ctx.strokeStyle = 'rgba(15, 17, 22, 0.85)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Draw outfit specific features
  if (outfit.type === 'suit') {
    // White shirt V-shape
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy + 5);
    ctx.lineTo(cx, cy + 35);
    ctx.lineTo(cx + 16, cy + 5);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#dfdfdf';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Red silk tie
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 15);
    ctx.lineTo(cx + 4, cy + 15);
    ctx.lineTo(cx + 6, cy + 85);
    ctx.lineTo(cx, cy + 95);
    ctx.lineTo(cx - 6, cy + 85);
    ctx.closePath();
    const tieGrad = ctx.createLinearGradient(cx - 5, cy + 15, cx + 5, cy + 90);
    tieGrad.addColorStop(0, '#be1e3c');
    tieGrad.addColorStop(1, '#800c1d');
    ctx.fillStyle = tieGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.stroke();

    // Suit lapels
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 5);
    ctx.lineTo(cx - 30, cy + 40);
    ctx.lineTo(cx - 5, cy + 55);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cx + 18, cy + 5);
    ctx.lineTo(cx + 30, cy + 40);
    ctx.lineTo(cx + 5, cy + 55);
    ctx.stroke();
  } 
  else if (outfit.type === 'streetwear') {
    // Hoodie collar opening
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy + 5);
    ctx.quadraticCurveTo(cx, cy + 42, cx + 22, cy + 5);
    ctx.quadraticCurveTo(cx, cy + 30, cx - 22, cy + 5);
    ctx.fillStyle = outfit.accent;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.stroke();

    // Neon drawstrings
    ctx.strokeStyle = outfit.neon;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 22);
    ctx.bezierCurveTo(cx - 12, cy + 50, cx - 4, cy + 70, cx - 10, cy + 75);
    ctx.moveTo(cx + 8, cy + 22);
    ctx.bezierCurveTo(cx + 12, cy + 50, cx + 4, cy + 70, cx + 10, cy + 75);
    ctx.stroke();
  }
  else if (outfit.type === 'techwear') {
    // Glowing neon zipper line and accent loops
    ctx.strokeStyle = outfit.neon;
    ctx.shadowBlur = 6;
    ctx.shadowColor = outfit.neon;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 12);
    ctx.lineTo(cx, cy + 90);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tactical shoulder pads overlay
    ctx.fillStyle = '#2b2e36';
    ctx.beginPath();
    ctx.moveTo(cx - width/2 + 5, cy + 70);
    ctx.lineTo(cx - width/2 + 25, cy + 30);
    ctx.lineTo(cx - width/3, cy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + width/2 - 5, cy + 70);
    ctx.lineTo(cx + width/2 - 25, cy + 30);
    ctx.lineTo(cx + width/3, cy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  else {
    // Ripped/frayed fabric cuts
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 30);
    ctx.lineTo(cx - 15, cy + 35);
    ctx.lineTo(cx - 25, cy + 45);
    ctx.stroke();
  }

  // Draw natural clothing folds (diagonal shadow curves)
  ctx.strokeStyle = outfit.folds;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - width/3, cy + 50);
  ctx.quadraticCurveTo(cx - width/4, cy + 75, cx - 15, cy + 90);
  ctx.moveTo(cx + width/3, cy + 50);
  ctx.quadraticCurveTo(cx + width/4, cy + 75, cx + 15, cy + 90);
  ctx.stroke();

  ctx.restore();
}

function drawNeck(ctx, cx, cy, width, shoulderY) {
  ctx.save();

  // Neck skin shading - linear gradient mimicking realistic ambient occlusion shadows
  const neckGrad = ctx.createLinearGradient(cx - width/2, cy, cx + width/2, cy);
  neckGrad.addColorStop(0, '#cca08c'); // Deep side shadow
  neckGrad.addColorStop(0.25, '#ecc3b4');
  neckGrad.addColorStop(0.5, '#f3d1c3'); // Center highlight
  neckGrad.addColorStop(0.75, '#ecc3b4');
  neckGrad.addColorStop(1, '#cca08c');

  ctx.fillStyle = neckGrad;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, cy - 5);
  ctx.lineTo(cx - width / 2, shoulderY + 8);
  ctx.lineTo(cx + width / 2, shoulderY + 8);
  ctx.lineTo(cx + width / 2, cy - 5);
  ctx.closePath();
  ctx.fill();

  // Soft neck contour lines (sternocleidomastoid muscles)
  ctx.strokeStyle = 'rgba(120, 75, 60, 0.18)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - width / 4, cy);
  ctx.quadraticCurveTo(cx - width / 5, cy + 30, cx - 8, shoulderY);
  ctx.moveTo(cx + width / 4, cy);
  ctx.quadraticCurveTo(cx + width / 5, cy + 30, cx + 8, shoulderY);
  ctx.stroke();

  // Throat Adam's apple shadow (for males)
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 12);
  ctx.lineTo(cx, cy + 20);
  ctx.lineTo(cx + 5, cy + 12);
  ctx.strokeStyle = 'rgba(100, 60, 45, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Drop shadow cast by the jaw onto the top neck area
  const dropShadow = ctx.createLinearGradient(cx, cy - 6, cx, cy + 12);
  dropShadow.addColorStop(0, 'rgba(40, 20, 15, 0.45)');
  dropShadow.addColorStop(1, 'rgba(40, 20, 15, 0)');
  ctx.fillStyle = dropShadow;
  ctx.fillRect(cx - width/2 - 2, cy - 6, width + 4, 20);

  ctx.restore();
}

function drawHead(ctx, cx, cy, jawType, asymmetry, botchedJaw, gender = 'male') {
  ctx.save();
  
  // Real human skin lighting: Radial gradient shifted slightly top-left to emulate light source
  const skinGrad = ctx.createRadialGradient(cx - 10, cy - 15, 8, cx, cy, 75);
  skinGrad.addColorStop(0, '#fdf0ea'); // Bright specular highlight
  skinGrad.addColorStop(0.3, '#f9dfd5'); // Healthy base skin
  skinGrad.addColorStop(0.85, '#ecc3b4'); // Normal shadow
  skinGrad.addColorStop(1, '#d59f8c'); // Deep contour shadow
  ctx.fillStyle = skinGrad;

  // Render Head structure
  ctx.beginPath();
  
  const topY = cy - 48;
  const leftX = cx - 44 + asymmetry;
  const rightX = cx + 44;
  const midY = cy;

  ctx.moveTo(cx, topY);
  // Forehead to cheek curvature
  ctx.quadraticCurveTo(leftX - 1, topY + 8, leftX, midY);
  
  // Jaw shape details (realistic chin contours)
  if (gender === 'female') {
    if (botchedJaw) {
      // Crooked, lumpy jawline
      ctx.lineTo(cx - 30 + asymmetry, cy + 28);
      ctx.lineTo(cx - 18 + asymmetry, cy + 43); // chin left
      ctx.lineTo(cx + 8, cy + 30);              // chin skewed up
      ctx.lineTo(cx + 35, cy + 15);             // jaw corner deformed
    } else if (jawType === 'Chiseled') {
      // Stacy-tier heart-shaped V-line jaw
      ctx.lineTo(cx - 30 + asymmetry, cy + 25);
      ctx.quadraticCurveTo(cx - 20 + asymmetry, cy + 38, cx - 9 + asymmetry, cy + 44); // narrow sharp chin
      ctx.lineTo(cx + 9, cy + 44);
      ctx.quadraticCurveTo(cx + 20, cy + 38, cx + 30, cy + 25);
    } else if (jawType === 'Sharp') {
      // Clean oval chin
      ctx.lineTo(cx - 28 + asymmetry, cy + 24);
      ctx.quadraticCurveTo(cx - 16 + asymmetry, cy + 34, cx - 6 + asymmetry, cy + 40);
      ctx.lineTo(cx + 6, cy + 40);
      ctx.quadraticCurveTo(cx + 16, cy + 34, cx + 28, cy + 24);
    } else if (jawType === 'Receding') {
      // Receding female chin
      ctx.lineTo(cx - 26 + asymmetry, cy + 16);
      ctx.quadraticCurveTo(cx - 15 + asymmetry, cy + 24, cx - 8 + asymmetry, cy + 28);
      ctx.lineTo(cx + 8, cy + 28);
      ctx.quadraticCurveTo(cx + 15, cy + 24, cx + 26, cy + 16);
    } else if (jawType === 'Soft') {
      // Rounded soft baby face
      ctx.quadraticCurveTo(leftX + 2, cy + 28, cx - 20 + asymmetry, cy + 37);
      ctx.quadraticCurveTo(cx, cy + 44, cx + 20, cy + 37);
      ctx.quadraticCurveTo(rightX - 2, cy + 28, rightX - 2, midY);
    } else {
      // Average female
      ctx.lineTo(cx - 27 + asymmetry, cy + 22);
      ctx.lineTo(cx - 8 + asymmetry, cy + 38);
      ctx.lineTo(cx + 8, cy + 38);
      ctx.lineTo(cx + 27, cy + 22);
    }
  } else {
    // MALE
    if (botchedJaw) {
      // Crooked, lumpy, mutated jawline
      ctx.lineTo(cx - 38 + asymmetry, cy + 33);
      ctx.lineTo(cx - 24 + asymmetry, cy + 46); // chin left
      ctx.lineTo(cx + 6, cy + 33);              // chin skewed up
      ctx.lineTo(cx + 38, cy + 20);             // jaw corner deformed
    } else if (jawType === 'Chiseled') {
      // GigaChad-tier sharp square jawline
      ctx.lineTo(cx - 38 + asymmetry, cy + 28); // Sharp jaw corner
      ctx.lineTo(cx - 18 + asymmetry, cy + 43); // Square chin left
      ctx.lineTo(cx + 18, cy + 43);              // Square chin right
      ctx.lineTo(cx + 38, cy + 28);              // Sharp jaw corner
    } else if (jawType === 'Sharp') {
      // Sculpted masculine jaw
      ctx.lineTo(cx - 34 + asymmetry, cy + 27);
      ctx.lineTo(cx - 10 + asymmetry, cy + 41);
      ctx.lineTo(cx + 10, cy + 41);
      ctx.lineTo(cx + 34, cy + 27);
    } else if (jawType === 'Receding') {
      // Receding male chin
      ctx.lineTo(cx - 30 + asymmetry, cy + 18);
      ctx.quadraticCurveTo(cx - 16 + asymmetry, cy + 27, cx - 11 + asymmetry, cy + 30);
      ctx.lineTo(cx + 11, cy + 30);
      ctx.quadraticCurveTo(cx + 16, cy + 27, cx + 30, cy + 18);
    } else if (jawType === 'Soft') {
      // Soft rounded jaw
      ctx.quadraticCurveTo(leftX, cy + 28, cx - 22 + asymmetry, cy + 38);
      ctx.quadraticCurveTo(cx, cy + 45, cx + 22, cy + 38);
      ctx.quadraticCurveTo(rightX, cy + 28, rightX, midY);
    } else {
      // Average male
      ctx.lineTo(cx - 32 + asymmetry, cy + 25);
      ctx.lineTo(cx - 12 + asymmetry, cy + 39);
      ctx.lineTo(cx + 12, cy + 39);
      ctx.lineTo(cx + 32, cy + 25);
    }
  }

  // Right cheek back to forehead
  ctx.lineTo(rightX, midY);
  ctx.quadraticCurveTo(rightX, topY, cx, topY);
  ctx.closePath();
  ctx.fill();

  // Face Stroke - soft charcoal sketch lines instead of stark thick vectors
  ctx.strokeStyle = 'rgba(25, 20, 15, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Ambient occlusion shadow on cheeks
  ctx.fillStyle = 'rgba(180, 100, 80, 0.15)';
  ctx.beginPath();
  ctx.ellipse(cx - 26 + asymmetry, cy + 10, 12, 6, 0.1, 0, Math.PI * 2);
  ctx.ellipse(cx + 26, cy + 10, 12, 6, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Draw Ears with inner helix folds
  drawEars(ctx, cx, cy, leftX, rightX);

  // Bruising & stitches for botched jaw surgery
  if (botchedJaw) {
    drawBotchedStitches(ctx, cx, cy);
  }

  ctx.restore();
}

function drawEars(ctx, cx, cy, leftX, rightX) {
  ctx.save();
  ctx.strokeStyle = 'rgba(25, 20, 15, 0.4)';
  ctx.lineWidth = 1.2;

  // Left Ear
  ctx.fillStyle = '#ecc3b4';
  ctx.beginPath();
  ctx.arc(leftX - 3, cy - 4, 8, Math.PI * 0.4, Math.PI * 1.65, false);
  ctx.fill();
  ctx.stroke();
  // Left inner ear shading
  ctx.fillStyle = 'rgba(100, 50, 40, 0.25)';
  ctx.beginPath();
  ctx.arc(leftX - 3, cy - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Right Ear
  ctx.fillStyle = '#ecc3b4';
  ctx.beginPath();
  ctx.arc(rightX + 3, cy - 4, 8, Math.PI * 0.6, Math.PI * 1.35, true);
  ctx.fill();
  ctx.stroke();
  // Right inner ear shading
  ctx.fillStyle = 'rgba(100, 50, 40, 0.25)';
  ctx.beginPath();
  ctx.arc(rightX + 3, cy - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBotchedStitches(ctx, cx, cy) {
  ctx.save();
  // Purple swelling bruise
  ctx.fillStyle = 'rgba(110, 30, 180, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx + 22, cy + 24, 15, 7, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Red incision cut
  ctx.strokeStyle = '#d90429';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 32);
  ctx.lineTo(cx + 34, cy + 23);
  ctx.stroke();

  // Surgical stitch ticks
  ctx.strokeStyle = '#050505';
  ctx.lineWidth = 1.0;
  for (let x = cx + 13; x <= cx + 31; x += 4.5) {
    const progress = (x - (cx + 13)) / 18;
    const yVal = (cy + 32) * (1 - progress) + (cy + 23) * progress;
    ctx.beginPath();
    ctx.moveTo(x - 1, yVal - 4);
    ctx.lineTo(x + 1, yVal + 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkinFeatures(ctx, cx, cy, skinVal) {
  ctx.save();
  
  if (skinVal < 30) {
    // Cystic Acne (severe red spots with soft shading)
    const spots = [
      {x: cx - 22, y: cy + 12, r: 4},
      {x: cx - 16, y: cy + 18, r: 2.5},
      {x: cx - 28, y: cy + 3, r: 5},
      {x: cx + 22, y: cy + 6, r: 4.5},
      {x: cx + 26, y: cy + 15, r: 3},
      {x: cx + 28, y: cy - 4, r: 4},
      {x: cx - 4, y: cy - 28, r: 3},
      {x: cx + 10, y: cy - 24, r: 4.5},
      {x: cx - 11, y: cy + 24, r: 3.5}
    ];
    spots.forEach(s => {
      // Red inflammation halo
      const acneGrad = ctx.createRadialGradient(s.x, s.y, 0.5, s.x, s.y, s.r);
      acneGrad.addColorStop(0, 'rgba(255, 230, 230, 0.95)'); // White center
      acneGrad.addColorStop(0.3, 'rgba(240, 80, 80, 0.9)'); // Red pustule
      acneGrad.addColorStop(1, 'rgba(240, 80, 80, 0)'); // Dissipating redness
      ctx.fillStyle = acneGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (skinVal < 60) {
    // Blotchy Skin (soft reddish/pink dry patches)
    ctx.fillStyle = 'rgba(210, 95, 95, 0.16)';
    const patches = [
      {x: cx - 20, y: cy + 10, rx: 14, ry: 8},
      {x: cx + 20, y: cy + 12, rx: 12, ry: 7},
      {x: cx - 8, y: cy - 25, rx: 18, ry: 6}
    ];
    patches.forEach(p => {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0.1, 0, Math.PI*2);
      ctx.fill();
    });
  } else if (skinVal > 90) {
    // Glass Skin Specular Highlights (Neon/cyan glowing sparks)
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f0ff';
    
    const glints = [
      {x: cx - 22, y: cy + 3},
      {x: cx + 22, y: cy + 2},
      {x: cx - 2, y: cy - 24}
    ];
    glints.forEach(g => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  ctx.restore();
}

function drawEyes(ctx, cx, cy, tiltType, asymmetry, timeMs, botchedCanthoplasty, gender = 'male', styleScore = 50, nameStr = "") {
  ctx.save();
  
  // Left eye center: cx - 18, Right eye center: cx + 18
  const lx = cx - 18 + asymmetry;
  const rx = cx + 18;
  
  // Botched canthoplasty forces left eye to droop asymmetrical
  const ly = cy + (botchedCanthoplasty ? 4.5 : 0);
  const ry = cy;
  
  const eyeW = 9.5;
  const eyeH = botchedCanthoplasty ? 3.2 : 5.0;
  
  // Eyeball shapes
  ctx.fillStyle = '#fbfbfb';
  ctx.strokeStyle = 'rgba(25, 20, 15, 0.4)';
  ctx.lineWidth = 1.1;

  // Blink logic: Blink for 160ms every 4.2 seconds
  const isBlinking = (Math.floor(timeMs / 4200) % 2 === 0) && (timeMs % 4200 < 160);

  if (isBlinking) {
    ctx.strokeStyle = 'rgba(15, 12, 10, 0.85)';
    ctx.lineWidth = 2.0;
    // Left closed eye lid
    ctx.beginPath();
    ctx.moveTo(lx - eyeW, ly);
    ctx.quadraticCurveTo(lx, ly + 2, lx + eyeW, ly);
    ctx.stroke();
    // Right closed eye lid
    ctx.beginPath();
    ctx.moveTo(rx - eyeW, ry);
    ctx.quadraticCurveTo(rx, ry + 2, rx + eyeW, ry);
    ctx.stroke();
    
    // Botched stitches under closed left eye
    if (botchedCanthoplasty) {
      drawBotchedEyeScars(ctx, lx, ly);
    }
    
    ctx.restore();
    return;
  }

  // Canthal tilt rotation angles
  let leftRot = 0;
  let rightRot = 0;
  if (tiltType === 'Positive') {
    leftRot = -0.11; // Outward corner tilted up (hunter eye looks)
    rightRot = 0.11;
  } else if (tiltType === 'Negative' || botchedCanthoplasty) {
    leftRot = botchedCanthoplasty ? 0.32 : 0.11; // Outward corner droops down
    rightRot = -0.11;
  }

  // Derive Iris Color based on name hash for unique character identities
  const irisColor = getIrisColorFromName(nameStr, styleScore);

  // Draw Left Eye
  ctx.save();
  ctx.translate(lx, ly);
  ctx.rotate(leftRot);
  drawRealisticEyeBall(ctx, eyeW, eyeH, irisColor, botchedCanthoplasty);
  drawEyelashes(ctx, eyeW, eyeH, 'left', gender);
  ctx.restore();

  // Draw Right Eye
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(rightRot);
  drawRealisticEyeBall(ctx, eyeW, 5.0, irisColor, false);
  drawEyelashes(ctx, eyeW, 5.0, 'right', gender);
  ctx.restore();

  // Botched stitches under eye
  if (botchedCanthoplasty) {
    drawBotchedEyeScars(ctx, lx, ly);
  }

  ctx.restore();
}

function drawRealisticEyeBall(ctx, w, h, irisColor, isBotched) {
  // Sclera (eyeball path)
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Soft pink corner tear duct (canthus)
  ctx.fillStyle = 'rgba(255, 180, 180, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-w + 1.5, 0, 2, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Colored Iris
  const irisR = h * 0.95;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, w - 0.5, h - 0.5, 0, 0, Math.PI * 2);
  ctx.clip(); // Clip iris within eye boundary

  // Draw Iris circle
  const irisGrad = ctx.createRadialGradient(0, 0, 0.2, 0, 0, irisR);
  irisGrad.addColorStop(0, '#0a0a0f'); // Central pupil shadow
  irisGrad.addColorStop(0.65, irisColor);
  irisGrad.addColorStop(1, adjustColorBrightness(irisColor, -40)); // Limbal ring (dark edge)
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(0, 0, irisR, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = isBotched ? '#5c0000' : '#08080c'; // blood red tint if botched
  ctx.beginPath();
  ctx.arc(0, 0, irisR * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Specular Reflection (Glint highlight)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.arc(-irisR * 0.25, -irisR * 0.25, irisR * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Secondary soft ambient glint
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(irisR * 0.3, irisR * 0.3, irisR * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEyelashes(ctx, w, h, side, gender) {
  if (gender !== 'female') return;
  
  ctx.save();
  ctx.strokeStyle = 'rgba(15, 12, 10, 0.9)';
  ctx.lineWidth = 1.25;
  
  const outerDir = (side === 'left') ? -1 : 1;

  // Outer lashes (longer)
  ctx.beginPath();
  ctx.moveTo(outerDir * (w - 2), -h/2);
  ctx.quadraticCurveTo(outerDir * (w + 2), -h - 4, outerDir * (w + 4), -h - 2);
  ctx.stroke();

  // Center lashes
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.quadraticCurveTo(outerDir * 1, -h - 4, outerDir * 2, -h - 4);
  ctx.stroke();

  // Inner lashes
  ctx.beginPath();
  ctx.moveTo(-outerDir * (w - 2), -h/2);
  ctx.quadraticCurveTo(-outerDir * (w - 1), -h - 2, -outerDir * (w - 0.5), -h - 2);
  ctx.stroke();

  ctx.restore();
}

function drawBotchedEyeScars(ctx, lx, ly) {
  ctx.save();
  ctx.strokeStyle = '#c9184a'; // blood red
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(lx, ly + 5.5, 7.2, 0.05 * Math.PI, 0.95 * Math.PI, false);
  ctx.stroke();
  
  // Tiny black stitch dots
  ctx.strokeStyle = '#151515';
  ctx.lineWidth = 0.8;
  for (let ox = -4; ox <= 4; ox += 3.5) {
    ctx.beginPath();
    ctx.moveTo(lx + ox, ly + 9.5);
    ctx.lineTo(lx + ox, ly + 13.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFacialFeatures(ctx, cx, cy, confidence, gender = 'male', styleScore = 50) {
  ctx.save();
  ctx.strokeStyle = 'rgba(25, 20, 15, 0.45)';
  ctx.lineWidth = 1.15;
  ctx.lineCap = 'round';

  // Realistic Nose Shading (No simple outline lines!)
  // Left side soft shadow
  ctx.fillStyle = 'rgba(125, 75, 60, 0.09)';
  ctx.beginPath();
  ctx.moveTo(cx - 3.5, cy - 8);
  ctx.lineTo(cx - 3.5, cy + 9);
  ctx.quadraticCurveTo(cx - 6, cy + 10, cx - 6, cy + 13);
  ctx.lineTo(cx - 2, cy + 13);
  ctx.closePath();
  ctx.fill();

  // Nose Bridge Highlight
  const noseHighlight = ctx.createLinearGradient(cx - 1, cy - 8, cx + 1, cy + 10);
  noseHighlight.addColorStop(0, 'rgba(255,255,255,0.85)');
  noseHighlight.addColorStop(1, 'rgba(255,255,255,0.1)');
  ctx.fillStyle = noseHighlight;
  ctx.fillRect(cx - 1.2, cy - 8, 2.4, 18);

  // Nose tip bulb shadow
  ctx.fillStyle = 'rgba(100, 50, 40, 0.18)';
  ctx.beginPath();
  ctx.arc(cx - 0.5, cy + 9.5, 3.2, 0, Math.PI * 2);
  ctx.fill();
  
  // Specular glint on nose tip
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 1, cy + 8.5, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Nostril holes (two dark dots underneath)
  ctx.fillStyle = 'rgba(20, 10, 5, 0.7)';
  ctx.beginPath();
  ctx.arc(cx - 3.5, cy + 11.5, 0.9, 0, Math.PI * 2);
  ctx.arc(cx + 2.5, cy + 11.5, 0.9, 0, Math.PI * 2);
  ctx.fill();

  // EYEBROWS (Fine strokes for realistic hair density)
  let browY = cy - 11;
  let browSlope = 0; // Neutral
  if (confidence > 75) {
    browSlope = 0.16; // Angled down inwards (assertive/confident looks)
    browY = cy - 12;
  } else if (confidence < 35) {
    browSlope = -0.14; // Angled up inwards (sad/worried looks)
    browY = cy - 10;
  }

  // Draw Left Eyebrow (cx - 27 to cx - 9)
  drawEyebrowStrokes(ctx, cx - 27, browY - browSlope * 5, cx - 9, browY + browSlope * 5, gender);

  // Draw Right Eyebrow (cx + 9 to cx + 27)
  drawEyebrowStrokes(ctx, cx + 9, browY + browSlope * 5, cx + 27, browY - browSlope * 5, gender);

  // MOUTH & LIPS
  const mouthY = cy + 22.5;
  const mouthW = 12.5;

  // Lip gloss shading (female features)
  let topLipColor = 'rgba(230, 150, 140, 0.6)';
  let botLipColor = 'rgba(245, 175, 165, 0.75)';

  if (gender === 'female') {
    if (styleScore >= 75) {
      topLipColor = 'rgba(200, 30, 80, 0.85)'; // glossy magenta
      botLipColor = 'rgba(230, 40, 100, 0.95)';
    } else if (styleScore >= 50) {
      topLipColor = 'rgba(219, 90, 120, 0.75)'; // soft pink lipstick
      botLipColor = 'rgba(240, 110, 140, 0.85)';
    } else {
      topLipColor = 'rgba(210, 125, 115, 0.7)';
      botLipColor = 'rgba(230, 145, 135, 0.8)';
    }
  }

  // Draw Top Lip
  ctx.fillStyle = topLipColor;
  ctx.beginPath();
  ctx.moveTo(cx - mouthW, mouthY);
  ctx.quadraticCurveTo(cx - mouthW/2, mouthY - 3.2, cx, mouthY - 1.2); // Cupid bow left
  ctx.quadraticCurveTo(cx + mouthW/2, mouthY - 3.2, cx + mouthW, mouthY);
  ctx.quadraticCurveTo(cx, mouthY - 0.5, cx - mouthW, mouthY);
  ctx.closePath();
  ctx.fill();

  // Draw Bottom Lip
  ctx.fillStyle = botLipColor;
  ctx.beginPath();
  ctx.moveTo(cx - mouthW, mouthY);
  ctx.quadraticCurveTo(cx, mouthY + 5.5, cx + mouthW, mouthY);
  ctx.quadraticCurveTo(cx, mouthY + 0.8, cx - mouthW, mouthY);
  ctx.closePath();
  ctx.fill();

  // Bottom lip specular highlight shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, mouthY + 2.8, 5, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Separation Mouth Center Line
  ctx.strokeStyle = 'rgba(20, 10, 5, 0.65)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  if (confidence > 80) {
    // Happy/Smug smirk
    ctx.arc(cx, mouthY - 3.5, mouthW, 0.08 * Math.PI, 0.92 * Math.PI, false);
  } else if (confidence < 30) {
    // Worried frown
    ctx.arc(cx, mouthY + 3.8, mouthW, 1.08 * Math.PI, 1.92 * Math.PI, false);
  } else {
    // Calm straight line
    ctx.moveTo(cx - mouthW, mouthY);
    ctx.lineTo(cx + mouthW, mouthY);
  }
  ctx.stroke();

  ctx.restore();
}

function drawEyebrowStrokes(ctx, x1, y1, x2, y2, gender) {
  ctx.save();
  ctx.strokeStyle = 'rgba(15, 10, 8, 0.7)';
  ctx.lineWidth = 0.85;

  const steps = 14;
  const genderHeight = (gender === 'female') ? 2.5 : 4.0;
  
  // Render individual hair strokes to build texture
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 * (1 - t) + x2 * t;
    const y = y1 * (1 - t) + y2 * t;
    ctx.beginPath();
    ctx.moveTo(x, y + 1);
    ctx.quadraticCurveTo(x + (x > (x1+x2)/2 ? 1 : -1), y - genderHeight, x + (x > (x1+x2)/2 ? 2.2 : -2.2), y - genderHeight - 1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackHair(ctx, cx, cy, hairline, gender) {
  if (gender !== 'female' || hairline > 5) return;
  ctx.save();

  // Long flowing back hair volumes (behind shoulders)
  ctx.fillStyle = '#060609'; // Deep obsidian
  ctx.beginPath();
  ctx.moveTo(cx - 45, cy + 20);
  ctx.quadraticCurveTo(cx - 52, cy + 60, cx - 48, cy + 120);
  ctx.lineTo(cx - 30, cy + 120);
  ctx.quadraticCurveTo(cx - 36, cy + 60, cx - 35, cy + 20);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + 45, cy + 20);
  ctx.quadraticCurveTo(cx + 52, cy + 60, cx + 48, cy + 120);
  ctx.lineTo(cx + 30, cy + 120);
  ctx.quadraticCurveTo(cx + 36, cy + 60, cx + 35, cy + 20);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawHair(ctx, cx, cy, hairline, botchedHair, gender = 'male') {
  ctx.save();
  ctx.fillStyle = '#0a0a0f'; // Dark charcoal base
  ctx.strokeStyle = 'rgba(15, 12, 10, 0.4)';
  ctx.lineWidth = 1.0;

  if (gender === 'female') {
    if (hairline <= 2) {
      // Ludwig 1: Luscious full hair with soft flow curves
      ctx.beginPath();
      ctx.moveTo(cx - 44, cy + 30);
      ctx.quadraticCurveTo(cx - 52, cy - 35, cx - 34, cy - 50);
      ctx.quadraticCurveTo(cx, cy - 60, cx + 34, cy - 50);
      ctx.quadraticCurveTo(cx + 52, cy - 35, cx + 44, cy + 30);
      ctx.lineTo(cx + 38, cy + 10);
      ctx.quadraticCurveTo(cx, cy - 18, cx - 38, cy + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Render fine strands overlay
      drawHairStrands(ctx, cx, cy - 25, 42, 60, '#1c1e26');
    }
    else if (hairline <= 5) {
      // Ludwig 2: Parted bob thinning style
      ctx.beginPath();
      ctx.moveTo(cx - 42, cy + 25);
      ctx.quadraticCurveTo(cx - 47, cy - 28, cx - 32, cy - 43);
      ctx.quadraticCurveTo(cx, cy - 52, cx + 32, cy - 43);
      ctx.quadraticCurveTo(cx + 47, cy - 28, cx + 42, cy + 25);
      ctx.lineTo(cx + 36, cy + 8);
      ctx.quadraticCurveTo(cx + 6, cy - 8, cx, cy - 5); // Right side of part
      ctx.moveTo(cx, cy - 5);
      ctx.quadraticCurveTo(cx - 6, cy - 8, cx - 36, cy + 8); // Left side of part
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Scalp parting exposure line
      ctx.strokeStyle = 'rgba(236, 195, 180, 0.85)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 43);
      ctx.lineTo(cx, cy - 12);
      ctx.stroke();
    }
    else {
      // Ludwig 3: Severe thinning, bald crown gap
      // Sparse side-hair bundles only
      ctx.beginPath();
      ctx.moveTo(cx - 41, cy + 25);
      ctx.quadraticCurveTo(cx - 44, cy - 10, cx - 30, cy - 20);
      ctx.lineTo(cx - 32, cy + 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 41, cy + 25);
      ctx.quadraticCurveTo(cx + 44, cy - 10, cx + 30, cy - 20);
      ctx.lineTo(cx + 32, cy + 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Exposed pink thinning scalp overlay
      ctx.fillStyle = 'rgba(236, 195, 180, 0.95)';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 35, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wispy single hairs across top
      ctx.strokeStyle = 'rgba(10, 10, 15, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 35);
      ctx.quadraticCurveTo(cx - 12, cy - 46, cx - 14, cy - 44);
      ctx.moveTo(cx + 8, cy - 35);
      ctx.quadraticCurveTo(cx + 12, cy - 46, cx + 14, cy - 44);
      ctx.stroke();
    }
  } else {
    // MALE
    if (hairline === 1) {
      // Norwood 1: Model hair volume with rich strand details
      ctx.beginPath();
      ctx.moveTo(cx - 44, cy + 22);
      ctx.quadraticCurveTo(cx - 48, cy - 24, cx - 33, cy - 38);
      ctx.quadraticCurveTo(cx, cy - 52, cx + 33, cy - 38);
      ctx.quadraticCurveTo(cx + 48, cy - 24, cx + 44, cy + 22);
      ctx.lineTo(cx + 36, cy + 10);
      ctx.quadraticCurveTo(cx, cy - 12, cx - 36, cy + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      drawHairStrands(ctx, cx, cy - 20, 36, 48, '#21252b');
    } 
    else if (hairline <= 3) {
      // Norwood 2-3: Receded temples M-shape
      ctx.beginPath();
      ctx.moveTo(cx - 43, cy + 22);
      ctx.quadraticCurveTo(cx - 46, cy - 18, cx - 30, cy - 33);
      ctx.quadraticCurveTo(cx, cy - 46, cx + 30, cy - 33);
      ctx.quadraticCurveTo(cx + 46, cy - 18, cx + 43, cy + 22);
      ctx.lineTo(cx + 36, cy + 12);
      ctx.quadraticCurveTo(cx + 20, cy + 8, cx + 18, cy - 3); // Right recess
      ctx.quadraticCurveTo(cx, cy + 6, cx - 18, cy - 3);  // Center dip
      ctx.quadraticCurveTo(cx - 20, cy + 8, cx - 36, cy + 12); // Left recess
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      drawHairStrands(ctx, cx, cy - 18, 30, 42, '#21252b');
    } 
    else if (hairline <= 5) {
      // Norwood 4-5: Bald top with thin front island
      // Left side bundle
      ctx.beginPath();
      ctx.moveTo(cx - 42, cy + 22);
      ctx.quadraticCurveTo(cx - 43, cy - 10, cx - 33, cy - 14);
      ctx.lineTo(cx - 36, cy + 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right side bundle
      ctx.beginPath();
      ctx.moveTo(cx + 42, cy + 22);
      ctx.quadraticCurveTo(cx + 43, cy - 10, cx + 33, cy - 14);
      ctx.lineTo(cx + 38, cy + 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Thin island patch on top front
      ctx.fillStyle = 'rgba(10, 10, 15, 0.7)';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } 
    else {
      // Norwood 6-7: Complete balding, horseshoe ring
      ctx.beginPath();
      ctx.moveTo(cx - 42, cy + 22);
      ctx.quadraticCurveTo(cx - 41, cy - 1, cx - 36, cy - 6);
      ctx.lineTo(cx - 38, cy + 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 42, cy + 22);
      ctx.quadraticCurveTo(cx + 41, cy - 1, cx + 36, cy - 6);
      ctx.lineTo(cx + 38, cy + 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Botched hair transplant follicles (red crusty follicles)
  if (botchedHair) {
    drawBotchedHairGrafts(ctx, cx, cy);
  }

  ctx.restore();
}

function drawHairStrands(ctx, cx, cy, wRad, hRad, highlightColor) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 0.85;
  // Overlay detailed hair strand strokes following the crown shape
  for (let i = 0; i < 18; i++) {
    const angle = Math.PI * (1.1 + (i / 17) * 0.8);
    const startX = cx + Math.cos(angle) * (wRad - 4);
    const startY = cy + Math.sin(angle) * (hRad - 4);
    const endX = cx + Math.cos(angle) * wRad;
    const endY = cy + Math.sin(angle) * hRad;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(cx + Math.cos(angle)* (wRad + 2), cy + Math.sin(angle)* (hRad + 2), endX, endY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBotchedHairGrafts(ctx, cx, cy) {
  ctx.save();
  // Hair plug coordinate spots
  const grafts = [
    {x: cx - 22, y: cy + 13}, {x: cx - 13, y: cy + 9}, {x: cx - 4, y: cy + 11},
    {x: cx + 4, y: cy + 11}, {x: cx + 13, y: cy + 9}, {x: cx + 22, y: cy + 13},
    {x: cx - 16, y: cy + 19}, {x: cx - 7, y: cy + 17}, {x: cx + 7, y: cy + 17},
    {x: cx + 16, y: cy + 19}, {x: cx - 9, y: cy + 25}, {x: cx + 9, y: cy + 25}
  ];

  grafts.forEach(g => {
    // Red inflamed circle base
    ctx.fillStyle = 'rgba(240, 50, 60, 0.9)';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Dark scab crust center
    ctx.fillStyle = '#1c0508';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Jagged plug hair follicle sticking out
    ctx.strokeStyle = '#0a0a0f';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + (g.x > cx ? 1.5 : -1.5), g.y - 2.8);
    ctx.stroke();
  });
  ctx.restore();
}

function drawHeightIndicator(ctx, w, h, heightInches) {
  ctx.save();
  
  const feet = Math.floor(heightInches / 12);
  const inches = Math.round(heightInches % 12);
  
  // Scale bar
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(w - 18, 45);
  ctx.lineTo(w - 18, h - 45);
  ctx.stroke();

  // Tick markers
  ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
  for (let tickY = 45; tickY <= h - 45; tickY += 15) {
    ctx.beginPath();
    ctx.moveTo(w - 22, tickY);
    ctx.lineTo(w - 18, tickY);
    ctx.stroke();
  }

  // Calculate indicator height percent
  const minH = 60; // 5'0
  const maxH = 80; // 6'8
  const clampedH = Math.max(minH, Math.min(maxH, heightInches));
  const percent = (clampedH - minH) / (maxH - minH);
  const indicatorY = (h - 90) * (1 - percent) + 45;

  // Neon pointer triangle
  ctx.fillStyle = '#ff007f';
  ctx.beginPath();
  ctx.moveTo(w - 14, indicatorY);
  ctx.lineTo(w - 8, indicatorY - 4);
  ctx.lineTo(w - 8, indicatorY + 4);
  ctx.closePath();
  ctx.fill();

  // Label text next to indicator
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px "JetBrains Mono"';
  ctx.fillText(`${feet}'${inches}"`, w - 46, indicatorY + 3);

  ctx.restore();
}

function drawAccessories(ctx, cx, headY, styleScore, gender = 'male', timeMs = 0) {
  ctx.save();

  // Pearl Earrings (female styling)
  if (gender === 'female' && styleScore >= 75) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.8;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 4;
    // Left pearl
    ctx.beginPath();
    ctx.arc(cx - 43, headY + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right pearl
    ctx.beginPath();
    ctx.arc(cx + 43, headY + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  // Sunglasses/Spec Glasses
  if (styleScore >= 50) {
    // Glare gradient dark lenses
    ctx.fillStyle = 'rgba(10, 12, 18, 0.96)';
    ctx.strokeStyle = styleScore >= 80 ? '#e5c158' : '#00f0ff'; // Gold for suit, Neon cyan for street
    ctx.lineWidth = 1.8;
    
    // Left lens
    ctx.beginPath();
    ctx.ellipse(cx - 18, headY - 10, 11.5, 6.5, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Right lens
    ctx.beginPath();
    ctx.ellipse(cx + 18, headY - 10, 11.5, 6.5, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glare highlight overlay on sunglasses lenses
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(cx - 24, headY - 13);
    ctx.lineTo(cx - 16, headY - 7);
    ctx.moveTo(cx + 12, headY - 13);
    ctx.lineTo(cx + 20, headY - 7);
    ctx.stroke();

    // Glasses bridge link
    ctx.strokeStyle = 'rgba(15,15,15,0.9)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(cx - 7, headY - 11);
    ctx.lineTo(cx + 7, headY - 11);
    ctx.stroke();
  }

  // Silver chain necklace
  if (styleScore >= 75) {
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, headY + 31, 19, 0.08 * Math.PI, 0.92 * Math.PI, false);
    ctx.stroke();

    // Chain links detailing (cross lines)
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, headY + 31, 19, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.setLineDash([2, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Medal drop
    ctx.fillStyle = '#e5c158'; // gold medallion
    ctx.beginPath();
    ctx.arc(cx, headY + 50, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Luxury headphones (Style >= 90)
  if (styleScore >= 90) {
    const pulseGlow = Math.abs(Math.sin(timeMs * 0.003));
    
    // Headband arc
    ctx.strokeStyle = '#d5dbdb';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, headY - 17, 44, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();

    // Glowing LED lights on headband
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + pulseGlow * 0.6})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(cx, headY - 17, 45.5, Math.PI * 1.25, Math.PI * 1.75, false);
    ctx.stroke();

    // Left ear cup
    ctx.fillStyle = '#eaeaea';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(cx - 45, headY - 3, 5.5, 12, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Left cup LED ring
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + pulseGlow * 0.7})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx - 45, headY - 3, 3, 7, 0.05, 0, Math.PI * 2);
    ctx.stroke();

    // Right ear cup
    ctx.fillStyle = '#eaeaea';
    ctx.beginPath();
    ctx.ellipse(cx + 45, headY - 3, 5.5, 12, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right cup LED ring
    ctx.beginPath();
    ctx.ellipse(cx + 45, headY - 3, 3, 7, -0.05, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawClinicalHUD(ctx, w, h, stats) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 240, 255, 0.45)';
  ctx.font = '7px "JetBrains Mono"';
  
  // Telemetry corners
  ctx.fillText('SUBJECT_SCAN: LIVE', 12, 18);
  ctx.fillText(`BIOMETRIC_SMV: ${stats.smv || '4.0'}/8`, 12, 28);
  ctx.fillText(`CLASS: ${stats.socialTier || 'NORMIE'}`, 12, 38);

  ctx.textAlign = 'right';
  ctx.fillText(`HEIGHT_INDICATOR: ${(stats.height || 68)} IN`, w - 12, 18);
  ctx.fillText(`RIZZ_INDEX: ${stats.rizz || 50}/100`, w - 12, 28);
  ctx.fillText('SYS_OK', w - 12, 38);

  ctx.restore();
}

// Helpers
function getIrisColorFromName(nameStr, styleScore) {
  if (styleScore >= 90) return '#00f0ff'; // Neon glowing cyan for cyber aesthetic
  
  const charSum = nameStr.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const colorIndex = charSum % 4;
  
  if (colorIndex === 0) return '#4f5d75'; // Soft steel blue
  if (colorIndex === 1) return '#2d6a4f'; // Olive green
  if (colorIndex === 2) return '#8c6239'; // Warm hazel/brown
  return '#1b263b'; // Slate dark blue
}

function adjustColorBrightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = (R > 0) ? R : 0;
  G = (G > 0) ? G : 0;
  B = (B > 0) ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}
