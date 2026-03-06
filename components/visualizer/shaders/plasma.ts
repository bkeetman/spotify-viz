const plasma = `uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

#define PI 3.14159265359

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  float speed = 0.4 + u_energy * 0.4;
  float t = u_time * speed;

  // Classic plasma: sum of sine waves at different frequencies and phases
  float v = 0.0;
  v += sin(p.x * 8.0 + t);
  v += sin(p.y * 6.0 + t * 0.8);
  v += sin((p.x + p.y) * 7.0 + t * 0.6);
  v += sin(length(p) * 10.0 - t * 1.5);
  v += sin(p.x * 3.0 - p.y * 4.0 + t * 0.4);
  v *= 0.2; // normalize

  // Beat adds extra wave
  v += u_beat * sin(length(p) * 20.0 - t * 3.0) * 0.15;

  // Map to three colors
  vec3 col = u_color_a * (sin(v * PI) * 0.5 + 0.5);
  col += u_color_b * (cos(v * PI * 1.3 + 1.0) * 0.5 + 0.5);
  col += u_color_c * (sin(v * PI * 0.7 + 2.0) * 0.5 + 0.5);
  col /= 2.0; // blend

  col *= 0.7 + u_energy * 0.5;
  col += u_beat * u_color_a * 0.2;

  gl_FragColor = vec4(col, 1.0);
}`

export default plasma
