const lava = `uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.35;
  float r = 0.28 + u_energy * 0.08 + u_beat * 0.06;

  vec2 b0 = vec2(sin(t * 1.1) * 0.55, cos(t * 0.73) * 0.65);
  vec2 b1 = vec2(cos(t * 0.87) * 0.45, sin(t * 1.27) * 0.55);
  vec2 b2 = vec2(sin(t * 0.65 + 1.0) * 0.60, cos(t * 1.05) * 0.45);
  vec2 b3 = vec2(cos(t * 1.17 + 2.0) * 0.35, sin(t * 0.83) * 0.70);
  vec2 b4 = vec2(sin(t * 0.52 + 3.0) * 0.70, cos(t * 0.94 + 1.5) * 0.35);

  float d = length(uv - b0) - r;
  d = smin(d, length(uv - b1) - r * 0.9, 0.32);
  d = smin(d, length(uv - b2) - r * 1.1, 0.32);
  d = smin(d, length(uv - b3) - r * 0.85, 0.32);
  d = smin(d, length(uv - b4) - r * 1.0, 0.32);

  vec3 bg = u_color_c * 0.12;
  vec3 blob = mix(u_color_b, u_color_a, smoothstep(-0.15, 0.15, d));
  vec3 col = mix(blob, bg, smoothstep(-0.05, 0.35, d));

  // Inner highlight
  col += u_color_a * 0.4 * smoothstep(0.05, -0.1, d);

  // Beat flash
  col += u_beat * u_color_a * 0.25;

  // Vignette
  float v = 1.0 - smoothstep(0.5, 1.4, length(uv * 0.7));
  col *= v;

  gl_FragColor = vec4(col, 1.0);
}`

export default lava
