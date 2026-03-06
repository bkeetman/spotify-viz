const prism = `uniform float u_time;
uniform vec2 u_resolution;
uniform float u_energy;
uniform float u_tempo;
uniform float u_beat;
uniform vec3 u_color_a;
uniform vec3 u_color_b;
uniform vec3 u_color_c;
uniform sampler2D u_album_tex;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 center = vec2(0.5);

  // Slowly rotating split direction
  float angle = u_time * 0.18;
  vec2 splitDir = vec2(cos(angle), sin(angle) * (1.0 / aspect));
  splitDir = normalize(splitDir) * vec2(1.0, 1.0 / aspect);

  // Split amount: baseline energy + beat pulse
  float splitAmt = 0.009 + u_energy * 0.007 + u_beat * 0.045;

  vec2 uvR = uv + splitDir * splitAmt;
  vec2 uvG = uv;
  vec2 uvB = uv - splitDir * splitAmt;

  // Subtle zoom-breathe on beat
  float zoom = 1.0 - u_beat * 0.025;
  uvR = (uvR - center) * zoom + center;
  uvG = (uvG - center) * zoom + center;
  uvB = (uvB - center) * zoom + center;

  float r = texture2D(u_album_tex, uvR).r;
  float g = texture2D(u_album_tex, uvG).g;
  float b = texture2D(u_album_tex, uvB).b;

  vec3 color = vec3(r, g, b);

  // Energy brightness
  color *= 0.85 + u_energy * 0.35;

  // Iridescent glow at split seams, accented by palette
  float seam = length(uvR - uvB) * 8.0;
  color += seam * u_color_a * 0.25 * (0.4 + u_beat * 0.6);

  // Vignette
  float vignette = 1.0 - smoothstep(0.42, 1.25, length(uv - center));
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}`

export default prism
