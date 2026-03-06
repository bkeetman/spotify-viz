const warp = `uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

#define TAU 6.28318530718
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

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float speed = 0.6 + u_energy * 0.8;
  float t = u_time * speed;

  float r = length(uv);
  float a = atan(uv.y, uv.x);

  // Tunnel coords: angle maps to x, depth (1/r) maps to y
  vec2 tunnel;
  tunnel.x = a / TAU;                   // 0..1 around the tunnel
  tunnel.y = 1.0 / (r + 0.05) * 0.3;  // depth into tunnel

  // Scroll forward
  tunnel.y += t;

  // Twist
  tunnel.x += tunnel.y * 0.15 + t * 0.05;

  // Layered pattern on tunnel walls
  float p1 = sin(tunnel.x * 18.0 + t * 0.5) * sin(tunnel.y * 6.0);
  float p2 = sin(tunnel.x * 7.0 - t * 0.3 + tunnel.y * 2.0) * 0.6;
  float p3 = noise(tunnel * 3.0 + t * 0.2) * 0.4;
  float pattern = (p1 + p2 + p3) * 0.33;

  vec3 col = mix(u_color_c, u_color_b, pattern * 0.5 + 0.5);
  col = mix(col, u_color_a, clamp(p1 * 0.5 + 0.5, 0.0, 1.0) * 0.6);

  // Bright tunnel edge (center)
  float edge = 1.0 - smoothstep(0.0, 0.15, r);
  col = mix(col, u_color_a * 2.0, edge * 0.5);

  // Depth fade: brighter at edge (far away), darker at center (near)
  col *= 0.3 + r * 1.2;
  col = clamp(col, 0.0, 2.0);

  // Beat flash
  col += u_beat * u_color_a * 0.4 * (1.0 - r);

  gl_FragColor = vec4(col, 1.0);
}`

export default warp
