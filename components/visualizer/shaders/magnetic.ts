const magnetic = `uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

#define PI 3.14159265359

vec2 fieldAt(vec2 p, vec2 pole, float charge) {
  vec2 r = p - pole;
  float d2 = dot(r, r) + 0.02;
  return charge * r / d2;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  uv.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.22;

  // Four moving poles: two positive, two negative
  vec2 p1 = vec2(cos(t * 0.71) * 0.55, sin(t * 0.53) * 0.45);
  vec2 p2 = vec2(cos(t * 0.59 + PI) * 0.55, sin(t * 0.79 + 1.0) * 0.45);
  vec2 p3 = vec2(cos(t * 0.43 + 2.0) * 0.35, sin(t * 0.61 + 2.5) * 0.35);
  vec2 p4 = vec2(cos(t * 0.67 + 3.5) * 0.45, sin(t * 0.47 + 0.7) * 0.50);

  vec2 field = fieldAt(uv, p1, 1.0)
             + fieldAt(uv, p2, -1.0)
             + fieldAt(uv, p3, 0.7)
             + fieldAt(uv, p4, -0.7);

  float mag = length(field);
  vec2 dir = mag > 0.001 ? field / mag : vec2(0.0);

  // Filing pattern: bright along field direction lines
  float filing = sin(dot(uv, dir) * 28.0) * 0.5 + 0.5;
  filing = pow(filing, 4.0);

  float intensity = filing * clamp(mag * 0.4, 0.0, 1.0);

  // Angle-based color
  float angle = atan(field.y, field.x);
  vec3 col = mix(u_color_c * 0.15, u_color_a, intensity);
  col = mix(col, u_color_b, (sin(angle * 2.0 + t) * 0.5 + 0.5) * intensity * 0.6);

  // Glow at poles
  col += u_color_a * 0.5 * exp(-length(uv - p1) * 6.0);
  col += u_color_b * 0.5 * exp(-length(uv - p2) * 6.0);

  col += u_beat * 0.25 * u_color_a;

  // Vignette
  col *= 1.0 - smoothstep(0.7, 1.4, length(uv));

  gl_FragColor = vec4(col, 1.0);
}`

export default magnetic
