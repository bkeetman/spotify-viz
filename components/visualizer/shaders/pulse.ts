const pulse = `uniform float u_time;
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
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time;

  vec3 color = u_color_c * 0.3;

  // Radial rings driven by beat
  for (int i = 0; i < 8; i++) {
    float phase = float(i) * 0.15;
    float r = mod(t * 0.4 + phase, 1.2);
    float ring = abs(length(p) - r * 1.5);
    float brightness = 1.0 - smoothstep(0.0, 0.06, ring);
    brightness *= 1.0 - r / 1.2;
    vec3 ringColor = mix(u_color_a, u_color_b, float(i) / 8.0);
    color += brightness * ringColor * (0.4 + u_energy * 0.6);
  }

  // Beat shockwave
  if (u_beat > 0.1) {
    float shockR = (1.0 - u_beat) * 2.0;
    float shock = 1.0 - smoothstep(0.0, 0.08, abs(length(p) - shockR));
    color += shock * u_color_a * u_beat * 2.0;

    // Chromatic aberration on beat (guard against zero-length p at center)
    if (length(p) > 0.001) {
      float aberration = u_beat * 0.015;
      vec2 rOffset = normalize(p) * aberration;
      float rChannel = length(p - rOffset) - shockR;
      float bChannel = length(p + rOffset) - shockR;
      color.r += (1.0 - smoothstep(0.0, 0.1, abs(rChannel))) * u_beat;
      color.b += (1.0 - smoothstep(0.0, 0.1, abs(bChannel))) * u_beat;
    }
  }

  // Center glow
  float glow = 0.05 / (length(p) + 0.01);
  color += glow * u_color_a * u_energy;

  // Vignette
  float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}`

export default pulse
