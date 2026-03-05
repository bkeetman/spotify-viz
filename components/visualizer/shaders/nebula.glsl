uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

#define TAU 6.28318530718

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float voronoi(vec2 p) {
  vec2 i_p = floor(p);
  vec2 f_p = fract(p);
  float minDist = 10.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = hash2(i_p + neighbor);
      point = 0.5 + 0.5 * sin(u_time * 0.3 + TAU * point);
      vec2 diff = neighbor + point - f_p;
      minDist = min(minDist, length(diff));
    }
  }
  return minDist;
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.12;

  // Domain warp for organic feel
  float warpX = noise(p * 1.5 + t);
  float warpY = noise(p * 1.5 + t + 5.2);
  vec2 warped = p + vec2(warpX, warpY) * 0.4;

  float v = voronoi(warped * 2.5 + t * 0.5);
  float v2 = voronoi(warped * 4.0 - t * 0.3);

  float field = v * 0.6 + v2 * 0.4;

  // Color based on field value
  vec3 color = mix(u_color_c, u_color_b, smoothstep(0.0, 0.5, field));
  color = mix(color, u_color_a, smoothstep(0.3, 0.7, field));

  // Nebula glow on cell edges
  float edge = 1.0 - smoothstep(0.0, 0.15, v);
  color += edge * u_color_a * (0.5 + u_energy * 0.8);

  // Beat flash
  color += u_beat * 0.2 * u_color_a;

  // Vignette
  float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
