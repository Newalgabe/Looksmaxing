/**
 * avatar.js
 * Renders a dynamic, cyber-brutalist clinical vector portrait on an HTML5 canvas
 * based on the character's physical and styling stats.
 */

export function drawAvatar(canvas, stats) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Draw background cyber grid
  drawBackgroundGrid(ctx, w, h, stats.height);

  // Normalize stats
  const heightVal = stats.height || 68; // in inches
  const jawType = stats.jaw || 'Average'; // Receding, Soft, Average, Sharp, Chiseled
  const tiltType = stats.tilt || 'Neutral'; // Negative, Neutral, Positive
  const hairline = stats.hairline || 2; // Norwood 1-7
  const skinVal = stats.skin || 50; // 0-100
  const frameVal = stats.frame || 50; // 0-100
  const styleVal = stats.style || 30; // 0-100
  const symmetry = stats.symmetry || 'Average';

  // Base configurations
  const centerX = w / 2;
  const centerY = h / 2 - 10;
  
  // Calculate sizing based on Frame
  let shoulderWidth = 110 + (frameVal / 100) * 80; // 110 to 190
  let neckWidth = 24 + (frameVal / 100) * 20; // 24 to 44
  
  // Asymmetry offsets (if asymmetrical, shift things slightly)
  let asymmetryOffset = 0;
  if (symmetry === 'Asymmetrical') {
    asymmetryOffset = 4;
  }

  // 1. Draw Body/Shoulders
  drawShoulders(ctx, centerX, centerY + 80, shoulderWidth, styleVal);

  // 2. Draw Neck
  drawNeck(ctx, centerX, centerY + 20, neckWidth, centerY + 80);

  // 3. Draw Head Shape (influenced by Jaw definition and symmetry)
  drawHead(ctx, centerX, centerY, jawType, asymmetryOffset);

  // 4. Draw Skin Details (Acne, blemishes, or glowing highlights)
  drawSkinFeatures(ctx, centerX, centerY, skinVal);

  // 5. Draw Eyes (influenced by Canthal Tilt)
  drawEyes(ctx, centerX, centerY - 10, tiltType, asymmetryOffset);

  // 6. Draw Eyebrows & Mouth
  drawFacialFeatures(ctx, centerX, centerY, stats.confidence);

  // 7. Draw Hair (influenced by Norwood Hairline scale)
  drawHair(ctx, centerX, centerY - 45, hairline);
  
  // 8. Height Scale Overlay Indicator
  drawHeightIndicator(ctx, w, h, heightVal);
}

function drawBackgroundGrid(ctx, w, h, heightInches) {
  // Deep gradient background
  const grad = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, w);
  grad.addColorStop(0, '#12141a');
  grad.addColorStop(1, '#08090c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Grid Lines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
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

  // Height chart markers on the left
  ctx.fillStyle = 'rgba(255, 0, 127, 0.2)';
  ctx.font = '7px "JetBrains Mono"';
  for (let y = 40; y < h - 40; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(10, y);
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.3)';
    ctx.stroke();
    
    // Height labels in ft/in
    const ftVal = Math.floor((h - y) / 45) + 3;
    const inVal = Math.floor(((h - y) % 45) / 3.75);
    ctx.fillText(`${ftVal}'${inVal}"`, 13, y + 3);
  }
}

function drawShoulders(ctx, cx, cy, width, styleScore) {
  ctx.save();
  
  // Clothing color based on style score
  let jacketColor = '#3e4451'; // Homeless/Poor
  let shirtColor = '#21252b';
  let neonTrim = 'transparent';

  if (styleScore >= 80) {
    jacketColor = '#0a0a0c'; // Dapper/Suit
    shirtColor = '#ffffff'; // White dress shirt
    neonTrim = '#ffea00'; // Gold lapel outline
  } else if (styleScore >= 60) {
    jacketColor = '#1e1c24'; // Trendy black jacket
    shirtColor = '#ff007f'; // Hot pink streetwear tee
    neonTrim = '#00f0ff'; // Cyan accent glow
  } else if (styleScore >= 30) {
    jacketColor = '#4b5263'; // Basic grey hoodie
    shirtColor = '#abb2bf';
  } else {
    jacketColor = '#2b221a'; // Ripped/dirty canvas shirt
    shirtColor = '#4f3b2f';
  }

  // Draw shoulders path
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, cy + 120);
  ctx.quadraticCurveTo(cx - width / 2 + 10, cy, cx - 15, cy);
  ctx.lineTo(cx + 15, cy);
  ctx.quadraticCurveTo(cx + width / 2 - 10, cy, cx + width / 2, cy + 120);
  ctx.closePath();

  ctx.fillStyle = jacketColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1b1e26';
  ctx.stroke();

  // Draw Shirt opening
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy);
  ctx.lineTo(cx, cy + 30);
  ctx.lineTo(cx + 15, cy);
  ctx.closePath();
  ctx.fillStyle = shirtColor;
  ctx.fill();
  ctx.stroke();

  // Draw collar/neon lines if premium style
  if (neonTrim !== 'transparent') {
    ctx.strokeStyle = neonTrim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx, cy + 32);
    ctx.lineTo(cx + 20, cy);
    ctx.shadowBlur = 8;
    ctx.shadowColor = neonTrim;
    ctx.stroke();
  }

  ctx.restore();
}

function drawNeck(ctx, cx, cy, width, shoulderY) {
  ctx.save();
  ctx.fillStyle = '#dfaf9b'; // Base skin shadow
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, cy);
  ctx.lineTo(cx - width / 2, shoulderY);
  ctx.lineTo(cx + width / 2, shoulderY);
  ctx.lineTo(cx + width / 2, cy);
  ctx.closePath();
  ctx.fill();

  // Shading / neck muscle line
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 5);
  ctx.lineTo(cx - 4, shoulderY - 10);
  ctx.moveTo(cx + 4, cy + 5);
  ctx.lineTo(cx + 4, shoulderY - 10);
  ctx.stroke();
  ctx.restore();
}

function drawHead(ctx, cx, cy, jawType, asymmetry) {
  ctx.save();
  
  // Skin gradient (base skin color)
  const skinGrad = ctx.createRadialGradient(cx, cy - 10, 5, cx, cy, 70);
  skinGrad.addColorStop(0, '#fce4db');
  skinGrad.addColorStop(1, '#ecc3b4');
  ctx.fillStyle = skinGrad;

  ctx.beginPath();
  
  // Custom Head shape based on Jaw type
  // Face bounds: top (cy - 40), sides (cx - 45, cx + 45)
  const topY = cy - 45;
  const leftX = cx - 42 + asymmetry;
  const rightX = cx + 42;
  const midY = cy;

  ctx.moveTo(cx, topY);
  // Forehead to cheek
  ctx.quadraticCurveTo(leftX, topY, leftX, midY);
  
  // Jaw shape definition
  if (jawType === 'Chiseled') {
    // Sharp angles, wider base
    ctx.lineTo(cx - 36 + asymmetry, cy + 30);
    ctx.lineTo(cx - 18 + asymmetry, cy + 42); // Square chin
    ctx.lineTo(cx + 18, cy + 42);
    ctx.lineTo(cx + 36, cy + 30);
  } else if (jawType === 'Sharp') {
    // Tapering to a sharp chin
    ctx.lineTo(cx - 32 + asymmetry, cy + 28);
    ctx.lineTo(cx - 8 + asymmetry, cy + 40);
    ctx.lineTo(cx + 8, cy + 40);
    ctx.lineTo(cx + 32, cy + 28);
  } else if (jawType === 'Receding') {
    // Small chin, curves back early
    ctx.lineTo(cx - 28 + asymmetry, cy + 20);
    ctx.quadraticCurveTo(cx - 15 + asymmetry, cy + 28, cx - 12 + asymmetry, cy + 32);
    ctx.lineTo(cx + 12, cy + 32);
    ctx.quadraticCurveTo(cx + 15, cy + 28, cx + 28, cy + 20);
  } else if (jawType === 'Soft') {
    // Rounded soft chin
    ctx.quadraticCurveTo(leftX, cy + 30, cx - 20 + asymmetry, cy + 38);
    ctx.quadraticCurveTo(cx, cy + 45, cx + 20, cy + 38);
    ctx.quadraticCurveTo(rightX, cy + 30, rightX, midY);
  } else {
    // Average
    ctx.lineTo(cx - 30 + asymmetry, cy + 26);
    ctx.lineTo(cx - 12 + asymmetry, cy + 38);
    ctx.lineTo(cx + 12, cy + 38);
    ctx.lineTo(cx + 30, cy + 26);
  }

  // Cheek back to forehead
  ctx.lineTo(rightX, midY);
  ctx.quadraticCurveTo(rightX, topY, cx, topY);
  ctx.closePath();
  ctx.fill();

  // Face Stroke (clinical look)
  ctx.strokeStyle = '#1b1e26';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Ears
  ctx.fillStyle = '#ecc3b4';
  ctx.strokeStyle = '#1b1e26';
  ctx.lineWidth = 2;
  // Left Ear
  ctx.beginPath();
  ctx.arc(leftX - 2, cy - 5, 8, Math.PI * 0.5, Math.PI * 1.6, false);
  ctx.fill();
  ctx.stroke();
  // Right Ear
  ctx.beginPath();
  ctx.arc(rightX + 2, cy - 5, 8, Math.PI * 0.5, Math.PI * 1.4, true);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawSkinFeatures(ctx, cx, cy, skinVal) {
  ctx.save();
  
  if (skinVal < 30) {
    // Cystic Acne (severe red spots)
    ctx.fillStyle = 'rgba(255, 85, 85, 0.7)';
    const spots = [
      {x: cx - 22, y: cy + 10, r: 3},
      {x: cx - 18, y: cy + 15, r: 2},
      {x: cx - 28, y: cy + 5, r: 4},
      {x: cx + 20, y: cy + 8, r: 3},
      {x: cx + 25, y: cy + 16, r: 2},
      {x: cx + 26, y: cy - 2, r: 3.5},
      {x: cx - 5, y: cy - 30, r: 2},
      {x: cx + 8, y: cy - 25, r: 3},
      {x: cx - 12, y: cy + 22, r: 2.5}
    ];
    spots.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
      // Draw white center for "cystic" look
      ctx.fillStyle = 'rgba(255, 235, 235, 0.9)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.4, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 85, 85, 0.7)';
    });
  } else if (skinVal < 60) {
    // Blotchy Skin (soft red/pink patches)
    ctx.fillStyle = 'rgba(235, 120, 120, 0.25)';
    const patches = [
      {x: cx - 20, y: cy + 8, rx: 12, ry: 7},
      {x: cx + 18, y: cy + 10, rx: 10, ry: 6},
      {x: cx - 8, y: cy - 28, rx: 15, ry: 5}
    ];
    patches.forEach(p => {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI*2);
      ctx.fill();
    });
  } else if (skinVal > 90) {
    // Glowing Skin (neon cyan and gold sparkles / highlights)
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f0ff';
    
    // Highlight glints
    const glints = [
      {x: cx - 24, y: cy + 5},
      {x: cx + 22, y: cy + 4},
      {x: cx - 2, y: cy - 26}
    ];
    glints.forEach(g => {
      ctx.beginPath();
      ctx.moveTo(g.x, g.y - 4);
      ctx.lineTo(g.x + 1, g.y - 1);
      ctx.lineTo(g.x + 4, g.y);
      ctx.lineTo(g.x + 1, g.y + 1);
      ctx.lineTo(g.x, g.y + 4);
      ctx.lineTo(g.x - 1, g.y + 1);
      ctx.lineTo(g.x - 4, g.y);
      ctx.lineTo(g.x - 1, g.y - 1);
      ctx.closePath();
      ctx.fill();
    });
  }
  
  ctx.restore();
}

function drawEyes(ctx, cx, cy, tiltType, asymmetry) {
  ctx.save();
  
  // Left eye center: cx - 18, Right eye center: cx + 18
  const lx = cx - 18 + asymmetry;
  const rx = cx + 18;
  const eyeRadiusX = 9;
  const eyeRadiusY = 4.5;
  
  // Eye shapes
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1b1e26';
  ctx.lineWidth = 1.8;

  // Let's determine eye tilt rotation angles
  let leftRot = 0;
  let rightRot = 0;
  if (tiltType === 'Positive') {
    leftRot = -0.12; // tilted up outwards
    rightRot = 0.12;
  } else if (tiltType === 'Negative') {
    leftRot = 0.12; // tilted down outwards
    rightRot = -0.12;
  }

  // Draw Left Eye
  ctx.save();
  ctx.translate(lx, cy);
  ctx.rotate(leftRot);
  ctx.beginPath();
  ctx.ellipse(0, 0, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.stroke();
  // Pupil
  ctx.fillStyle = '#08090d';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // Draw Right Eye
  ctx.save();
  ctx.translate(rx, cy);
  ctx.rotate(rightRot);
  ctx.beginPath();
  ctx.ellipse(0, 0, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.stroke();
  // Pupil
  ctx.fillStyle = '#08090d';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawFacialFeatures(ctx, cx, cy, confidence) {
  ctx.save();
  ctx.strokeStyle = '#1b1e26';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';

  // Nose (standard minimalist nose)
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 6);
  ctx.lineTo(cx - 2, cy + 10);
  ctx.lineTo(cx + 3, cy + 10);
  ctx.stroke();

  // Eyebrows (draw above eyes: cy - 10)
  // Confidence influences how angry/confident the eyebrows look
  let browYOffset = 0;
  let browSlope = 0; // neutral
  if (confidence > 75) {
    browSlope = 0.15; // angled downwards inwards (aggressive/alpha)
    browYOffset = -2;
  } else if (confidence < 35) {
    browSlope = -0.12; // angled upwards inwards (sad/beta)
    browYOffset = 1;
  }

  // Left Eyebrow (cx - 27 to cx - 9)
  ctx.beginPath();
  ctx.moveTo(cx - 27, cy - 9 + browYOffset - browSlope * 5);
  ctx.lineTo(cx - 10, cy - 9 + browYOffset + browSlope * 5);
  ctx.stroke();

  // Right Eyebrow (cx + 9 to cx + 27)
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy - 9 + browYOffset + browSlope * 5);
  ctx.lineTo(cx + 27, cy - 9 + browYOffset - browSlope * 5);
  ctx.stroke();

  // Mouth (cy + 22)
  // Confidence influences smile/frown
  ctx.beginPath();
  const mouthY = cy + 22;
  const mouthWidth = 12;

  if (confidence > 80) {
    // Smug smirk/smile
    ctx.arc(cx, mouthY - 3, mouthWidth, 0.1 * Math.PI, 0.9 * Math.PI, false);
  } else if (confidence < 30) {
    // Frown
    ctx.arc(cx, mouthY + 5, mouthWidth, 1.1 * Math.PI, 1.9 * Math.PI, false);
  } else {
    // Straight line
    ctx.moveTo(cx - mouthWidth, mouthY);
    ctx.lineTo(cx + mouthWidth, mouthY);
  }
  ctx.stroke();

  ctx.restore();
}

function drawHair(ctx, cx, cy, hairline) {
  ctx.save();
  ctx.fillStyle = '#08090d'; // Deep black/obsidian hair
  ctx.strokeStyle = '#1b1e26';
  ctx.lineWidth = 2;

  // Hair Outline changes based on Norwood hairline index
  // Norwood 1: Full thick hair covering forehead
  // Norwood 3: Receded temples
  // Norwood 5: Receded temples + thin crown circle
  // Norwood 7: Bald top, hair only on sides

  if (hairline === 1) {
    // Giga-thick model hair
    ctx.beginPath();
    ctx.moveTo(cx - 45, cy + 25);
    ctx.quadraticCurveTo(cx - 50, cy - 25, cx - 35, cy - 40);
    ctx.quadraticCurveTo(cx, cy - 55, cx + 35, cy - 40);
    ctx.quadraticCurveTo(cx + 50, cy - 25, cx + 45, cy + 25);
    // Lower hair line (no recession)
    ctx.lineTo(cx + 38, cy + 10);
    ctx.quadraticCurveTo(cx, cy - 10, cx - 38, cy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } 
  else if (hairline <= 3) {
    // Norwood 2-3: Mild to moderate temple recession
    ctx.beginPath();
    ctx.moveTo(cx - 44, cy + 25);
    ctx.quadraticCurveTo(cx - 48, cy - 20, cx - 32, cy - 35);
    ctx.quadraticCurveTo(cx, cy - 48, cx + 32, cy - 35);
    ctx.quadraticCurveTo(cx + 48, cy - 20, cx + 44, cy + 25);
    // Receded hairline boundary (M-shape)
    ctx.lineTo(cx + 38, cy + 12);
    ctx.quadraticCurveTo(cx + 20, cy + 8, cx + 18, cy - 5); // Right temple recess
    ctx.quadraticCurveTo(cx, cy + 8, cx - 18, cy - 5);  // Center dip
    ctx.quadraticCurveTo(cx - 20, cy + 8, cx - 38, cy + 12); // Left temple recess
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } 
  else if (hairline <= 5) {
    // Norwood 4-5: Severe hairline recession, crown balding
    // Hair on sides
    ctx.beginPath();
    ctx.moveTo(cx - 44, cy + 25);
    ctx.quadraticCurveTo(cx - 45, cy - 10, cx - 35, cy - 15);
    ctx.lineTo(cx - 38, cy + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 44, cy + 25);
    ctx.quadraticCurveTo(cx + 45, cy - 10, cx + 35, cy - 15);
    ctx.lineTo(cx + 38, cy + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Isolated thin hair patch on top front (island)
    ctx.fillStyle = 'rgba(8, 9, 13, 0.7)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 10, 6, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
  } 
  else {
    // Norwood 6-7: Complete baldness on top, narrow horseshoe hair ring around sides/back
    ctx.beginPath();
    ctx.moveTo(cx - 44, cy + 25);
    ctx.quadraticCurveTo(cx - 43, cy, cx - 38, cy - 5);
    ctx.lineTo(cx - 40, cy + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 44, cy + 25);
    ctx.quadraticCurveTo(cx + 43, cy, cx + 38, cy - 5);
    ctx.lineTo(cx + 40, cy + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawHeightIndicator(ctx, w, h, heightInches) {
  ctx.save();
  
  // Convert height to ft/in
  const feet = Math.floor(heightInches / 12);
  const inches = Math.round(heightInches % 12);
  
  // Height indicator bar on the right
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w - 20, 40);
  ctx.lineTo(w - 20, h - 40);
  ctx.stroke();

  // Calculate pixel Y-coordinate corresponding to height
  // Scale range: 5'3" (63 in) is near bottom, 6'6" (78 in) is near top
  // Say, minHeight = 60 inches, maxHeight = 80 inches
  const minH = 60;
  const maxH = 80;
  const clampedHeight = Math.max(minH, Math.min(maxH, heightInches));
  const percent = (clampedHeight - minH) / (maxH - minH);
  const indicatorY = (h - 80) * (1 - percent) + 40;

  // Draw arrow pointing to current height level
  ctx.fillStyle = varColor('--accent-magenta');
  ctx.beginPath();
  ctx.moveTo(w - 15, indicatorY);
  ctx.lineTo(w - 8, indicatorY - 4);
  ctx.lineTo(w - 8, indicatorY + 4);
  ctx.closePath();
  ctx.fill();

  // Text label next to indicator
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px "JetBrains Mono"';
  ctx.fillText(`${feet}'${inches}"`, w - 46, indicatorY + 3);

  ctx.restore();
}

// Helper to pull css variables in canvas
function varColor(cssVarName) {
  if (cssVarName === '--accent-magenta') return '#ff007f';
  if (cssVarName === '--accent-cyan') return '#00f0ff';
  if (cssVarName === '--accent-green') return '#39ff14';
  return '#ffffff';
}
