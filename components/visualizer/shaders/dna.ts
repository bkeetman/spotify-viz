const dna = `uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

#define PI 3.14159265359
#define TAU 6.28318530718

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.5;
  float freq = 2.8;       // helix frequency along Y
  float amp = 0.38;       // helix amplitude in X

  vec3 col = u_color_c * 0.08;

  // --- Two helical strands ---
  for (int strand = 0; strand < 2; strand++) {
    float phase = float(strand) * PI; // strands are 180 degrees apart
    float helixX = cos(uv.y * freq + t + phase) * amp;
    float dist = abs(uv.x - helixX);

    float thickness = 0.025 + u_energy * 0.008;
    float brightness = 1.0 - smoothstep(0.0, thickness * 2.5, dist);
    brightness = pow(brightness, 1.5);

    // Depth cue: vary brightness based on Z position (sin of helix angle)
    float z = sin(uv.y * freq + t + phase); // +1 = front, -1 = back
    float depthFade = 0.4 + 0.6 * (z * 0.5 + 0.5);

    vec3 strandCol = strand == 0 ? u_color_a : u_color_b;
    col += brightness * depthFade * strandCol * (0.7 + u_energy * 0.4);
  }

  // --- Connecting rungs ---
  // Rungs appear at regular intervals along Y
  float rungSpacing = TAU / freq;
  float yPhase = mod(uv.y + t / freq, rungSpacing) / rungSpacing; // 0..1 per period

  if (yPhase < 0.12) {
    // Y position of this rung
    float rungY = uv.y - yPhase * rungSpacing;
    float strand1X = cos(rungY * freq + t) * amp;
    float strand2X = cos(rungY * freq + t + PI) * amp;

    float minX = min(strand1X, strand2X);
    float maxX = max(strand1X, strand2X);

    if (uv.x > minX - 0.01 && uv.x < maxX + 0.01) {
      float rungT = clamp((uv.x - minX) / (maxX - minX + 0.001), 0.0, 1.0);
      vec3 rungCol = mix(u_color_a, u_color_b, rungT);
      float rungFade = (1.0 - yPhase / 0.12) * 0.5;
      col += rungCol * rungFade;
    }
  }

  // Beat pulse along the helix
  col += u_beat * u_color_a * 0.35 * exp(-abs(uv.y) * 1.5);

  // Vignette
  float vignette = 1.0 - smoothstep(0.5, 1.3, length(uv * vec2(1.2, 0.5)));
  col *= vignette;

  gl_FragColor = vec4(col, 1.0);
}`

export default dna
