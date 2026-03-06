const synthwave = `uniform float u_time;
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

  float horizon = 0.48;
  float t = u_time * 0.5;
  float speed = 0.4 + u_energy * 0.6;

  vec3 col = vec3(0.0);

  if (uv.y > horizon) {
    // --- SKY ---
    float skyT = (uv.y - horizon) / (1.0 - horizon);
    col = mix(u_color_c * 0.6, u_color_c * 0.1, skyT);

    // Stars
    vec2 starUV = uv * vec2(80.0, 40.0);
    vec2 si = floor(starUV);
    float star = fract(sin(dot(si, vec2(127.1, 311.7))) * 43758.5453);
    star = step(0.97, star) * smoothstep(0.0, 0.3, skyT);
    col += star * 0.8;

    // Sun
    vec2 sunCenter = vec2(0.5, horizon + 0.1);
    float sunR = 0.11 + u_beat * 0.01;
    float sunDist = length(uv - sunCenter);
    float sun = smoothstep(sunR + 0.003, sunR, sunDist);

    // Scanlines on sun
    float scan = step(0.5, fract(uv.y * 38.0));
    float scanMask = smoothstep(sunR, sunR * 0.5, sunDist);
    float sunFinal = sun * (1.0 - scan * scanMask * 0.6);

    vec3 sunColor = mix(u_color_a * 2.0, u_color_b, sunDist / sunR);
    col = mix(col, sunColor, sunFinal);

    // Sun glow
    col += u_color_a * 0.25 * exp(-sunDist * 8.0);
    col += u_color_b * 0.15 * exp(-sunDist * 3.0);

  } else {
    // --- GRID FLOOR ---
    float depth = horizon - uv.y; // 0 at horizon -> horizon at bottom
    float perspective = depth / horizon; // 0..1

    // Scroll the grid forward
    float scrolled = 1.0 / (perspective + 0.001) * 0.08 - t * speed;

    // Horizontal lines
    float hLine = 1.0 - smoothstep(0.0, 0.015, abs(fract(scrolled) - 0.5) - 0.47);

    // Vertical lines with perspective foreshortening
    float cols = 10.0;
    float vCoord = (uv.x - 0.5) / (perspective + 0.001) * 0.15;
    float vLine = 1.0 - smoothstep(0.0, 0.02, abs(fract(vCoord * cols) - 0.5) - 0.47);

    float grid = max(hLine, vLine);

    // Floor color
    col = u_color_c * 0.08;
    col += u_color_a * grid * (1.0 - perspective) * 0.9;
    col += u_color_b * grid * perspective * 0.4;

    // Horizon glow bleed
    col += u_color_b * 0.15 * exp(-depth * 12.0);
    col += u_color_a * 0.08 * exp(-depth * 6.0);
  }

  // Scanline overlay (CRT feel)
  col *= 0.88 + 0.12 * sin(uv.y * u_resolution.y * 1.5);

  // Beat flash
  col += u_beat * u_color_a * 0.12;

  // Vignette
  col *= 1.0 - smoothstep(0.4, 1.0, length((uv - 0.5) * vec2(1.0, 1.6)));

  gl_FragColor = vec4(col, 1.0);
}`

export default synthwave
