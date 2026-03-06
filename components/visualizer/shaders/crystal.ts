const crystal = `uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

mat2 rot2(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}

vec3 calcNormal(vec3 p, float t_rot) {
  vec3 rp = p;
  rp.xz = rot2(t_rot) * rp.xz;
  rp.yz = rot2(t_rot * 0.7) * rp.yz;
  float s = 0.8;
  vec2 e = vec2(0.001, 0.0);
  vec3 rp_ex = rp + e.xyy; rp_ex.xz = rot2(t_rot) * rp_ex.xz; rp_ex.yz = rot2(t_rot * 0.7) * rp_ex.yz;
  // Simpler normal via finite differences on the SDF directly
  return normalize(vec3(
    sdOctahedron(rp + e.xyy, s) - sdOctahedron(rp - e.xyy, s),
    sdOctahedron(rp + e.yxy, s) - sdOctahedron(rp - e.yxy, s),
    sdOctahedron(rp + e.yyx, s) - sdOctahedron(rp - e.yyx, s)
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float t_rot = u_time * 0.28;
  float gemSize = 0.75 + u_beat * 0.06;

  // Camera
  vec3 ro = vec3(0.0, 0.0, 2.8);
  vec3 rd = normalize(vec3(uv, -1.8));

  // Raymarch
  float dist = 0.0;
  float d = 1.0;
  vec3 p = ro;

  for (int i = 0; i < 80; i++) {
    p = ro + rd * dist;
    // Rotate the gem
    p.xz = rot2(t_rot) * p.xz;
    p.yz = rot2(t_rot * 0.7) * p.yz;
    d = sdOctahedron(p, gemSize);
    if (d < 0.001 || dist > 8.0) break;
    dist += d * 0.7;
  }

  vec3 col = u_color_c * 0.12;

  if (d < 0.001) {
    vec3 hit = ro + rd * dist;
    vec3 n = calcNormal(hit, t_rot);

    // Fresnel
    float fresnel = pow(1.0 - abs(dot(n, -rd)), 3.0);

    // Light direction
    vec3 ld = normalize(vec3(1.0, 1.5, 2.0));
    float diff = max(0.0, dot(n, ld));
    float spec = pow(max(0.0, dot(reflect(-ld, n), -rd)), 32.0);

    // Prismatic color split
    vec3 gemCol = mix(u_color_b, u_color_a, fresnel);
    gemCol += u_color_c * diff * 0.5;
    gemCol += vec3(1.0) * spec * 0.8;

    // Color shift with normal direction for facet visibility
    gemCol = mix(gemCol, u_color_b, abs(n.x) * 0.4);
    gemCol = mix(gemCol, u_color_a, abs(n.y) * 0.4);

    col = gemCol * (0.7 + u_energy * 0.5);
    col += u_beat * u_color_a * 0.3;
  } else {
    // Background: subtle radial glow
    col += u_color_c * 0.1 * exp(-length(uv) * 1.5);
  }

  gl_FragColor = vec4(col, 1.0);
}`

export default crystal
