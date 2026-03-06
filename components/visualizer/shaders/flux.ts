const flux = `uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

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
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p * freq);
    freq *= 2.1;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= aspect;

  float speed = u_tempo / 120.0 * 0.15;
  float t = u_time * speed;

  // Domain warp — two levels
  vec2 q = vec2(
    fbm(p + t * 0.4),
    fbm(p + vec2(5.2, 1.3) + t * 0.3)
  );
  vec2 warpedP = p + 0.45 * q;

  // Beat ripple expands outward from center
  float dist = length(p);
  float ripple = u_beat * sin(dist * 14.0 - u_time * 10.0) * 0.05;
  if (dist > 0.001) warpedP += normalize(p) * ripple;

  // Map warped p back to [0,1] texture UV
  warpedP.x /= aspect;
  vec2 texUV = clamp(warpedP * 0.5 + 0.5, 0.0, 1.0);

  vec3 color = texture2D(u_album_tex, texUV).rgb;

  // Brighten with energy
  color *= 0.8 + u_energy * 0.45;

  // Subtle beat flash using palette accent
  color += u_beat * u_color_a * 0.18;

  // Vignette
  float vignette = 1.0 - smoothstep(0.38, 1.3, length(uv - 0.5));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}`

export default flux
