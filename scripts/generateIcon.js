const sharp = require('sharp');
const fs = require('fs');

// Create SVG string
const svgString = `
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
    <rect width="180" height="180" fill="#ffffff"/>
    <!-- Outer ring -->
    <circle 
        cx="90" 
        cy="90" 
        r="82" 
        fill="#ffffff"
        stroke="#000000"
        stroke-width="7"
    />
    
    <!-- Inner decorative ring -->
    <circle 
        cx="90" 
        cy="90" 
        r="68" 
        fill="none"
        stroke="#000000"
        stroke-width="4"
        stroke-dasharray="14 7"
    />
    
    <!-- TL Text -->
    <text
        x="90"
        y="105"
        text-anchor="middle"
        font-family="Arial"
        font-weight="bold"
        font-size="58"
        fill="#000000"
    >
        TL
    </text>
</svg>
`;

// Convert SVG to PNG
sharp(Buffer.from(svgString))
    .resize(180, 180)
    .toFile('./public/apple-touch-icon.png')
    .then(() => console.log('Icon generated successfully!'))
    .catch(err => console.error('Error generating icon:', err)); 