const aurora = `uniform float u_time;
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
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 6; i++) {
    v += amp * noise(p * freq);
    freq *= 2.1;
    amp *= 0.48;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  float speed = u_tempo / 120.0 * 0.3;
  float t = u_time * speed;

  // Domain warp
  vec2 q = vec2(fbm(p + t * 0.5), fbm(p + vec2(5.2, 1.3)));
  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * t),
    fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * t)
  );

  float f = fbm(p + 4.0 * r);

  // Mix colors based on fbm field
  vec3 color = mix(u_color_c, u_color_b, clamp(f * f * 4.0, 0.0, 1.0));
  color = mix(color, u_color_a, clamp(length(q), 0.0, 1.0));
  color = mix(color, u_color_a * 1.5, clamp(length(r.x), 0.0, 1.0));

  // Energy influences brightness
  color *= 0.7 + u_energy * 0.6;

  // Beat flash
  color += u_beat * u_color_a * 0.3;

  // Vignette
  float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - 0.5));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}`

export default aurora
