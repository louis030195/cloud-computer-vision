function rainbow(n, maxLength) {
  n = n * 240 / maxLength;
  return 'hsl(' + n + ',100%,50%)';
}

function perc2color(perc, min, max) {
  let base = (max - min);

  if (base == 0) { perc = 100; }
  else {
      perc = (perc - min) / base * 100;
  }
  let r, g, b = 0;
  if (perc < 50) {
      r = 255;
      g = Math.round(5.1 * perc);
  }
  else {
      g = 255;
      r = Math.round(510 - 5.10 * perc);
  }
  let h = r * 0x10000 + g * 0x100 + b * 0x1;
  return '#' + ('000000' + h.toString(16)).slice(-6);
}


module.exports = {
  rainbow,
  perc2color
}