const kaleidoscope = `uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

#define PI 3.14159265359

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p *= 2.1;
    amp *= 0.5;
  }
  return v;
}

vec2 kaleido(vec2 p, float n) {
  float angle = atan(p.y, p.x);
  float r = length(p);
  float a = PI / n;
  angle = mod(angle, 2.0 * a);
  if (angle > a) angle = 2.0 * a - angle;
  return r * vec2(cos(angle), sin(angle));
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.2;

  // Slowly rotate the input
  float rotAngle = t * 0.15;
  float cs = cos(rotAngle), sn = sin(rotAngle);
  uv = vec2(cs * uv.x - sn * uv.y, sn * uv.x + cs * uv.y);

  // Apply kaleidoscope mirror (6-fold)
  vec2 k = kaleido(uv, 6.0);

  // FBM on mirrored coords
  vec2 q = vec2(fbm(k + t * 0.4), fbm(k + vec2(3.7, 1.9) + t * 0.3));
  vec2 r2 = vec2(fbm(k + 4.0 * q + t * 0.2), fbm(k + 4.0 * q + vec2(2.1, 5.3)));
  float f = fbm(k + 3.0 * r2 + t * 0.1);

  vec3 col = mix(u_color_c, u_color_b, clamp(f * 2.0, 0.0, 1.0));
  col = mix(col, u_color_a, clamp(length(q) * 0.8, 0.0, 1.0));
  col *= 0.7 + u_energy * 0.6;
  col += u_beat * u_color_a * 0.3;

  // Center dark hole
  float center = smoothstep(0.05, 0.2, length(uv));
  col *= center;

  gl_FragColor = vec4(col, 1.0);
}`

export default kaleidoscope
