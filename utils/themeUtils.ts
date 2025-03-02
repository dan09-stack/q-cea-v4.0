export const shadeColor = (color: string, percent: number) => {
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = Math.floor(R * (100 + percent) / 100);
  G = Math.floor(G * (100 + percent) / 100);
  B = Math.floor(B * (100 + percent) / 100);

  R = (R<255)?R:255;  
  G = (G<255)?G:255;  
  B = (B<255)?B:255;  

  const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
  const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
  const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

  return "#"+RR+GG+BB;
}

export const getContrastTextColor = (bgColor: string) => {
    // Convert hex to RGB
    const r = parseInt(bgColor.substring(1,3),16);
    const g = parseInt(bgColor.substring(3,5),16);
    const b = parseInt(bgColor.substring(5,7),16);
    
    // Calculate luminance - standard formula for perceived brightness
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for bright colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
  
  // Update the createGradient function to return the correct type
  export const createGradient = (baseColor: string): readonly [string, string, string] => {
    return [
      baseColor,
      shadeColor(baseColor, -15),
      shadeColor(baseColor, -30)
    ] as const; // Use 'as const' to make it a readonly tuple
  };
  
  // Generate complementary color
  export const getComplementaryColor = (hexColor: string) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substring(1,3),16);
    const g = parseInt(hexColor.substring(3,5),16);
    const b = parseInt(hexColor.substring(5,7),16);
    
    // Invert the colors
    const rComp = 255 - r;
    const gComp = 255 - g;
    const bComp = 255 - b;
    
    // Convert back to hex
    return `#${rComp.toString(16).padStart(2,'0')}${gComp.toString(16).padStart(2,'0')}${bComp.toString(16).padStart(2,'0')}`;
  }