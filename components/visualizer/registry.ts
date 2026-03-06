import auroraSrc from './shaders/aurora'
import pulseSrc from './shaders/pulse'
import nebulaSrc from './shaders/nebula'
import lavaSrc from './shaders/lava'
import kaleidoscopeSrc from './shaders/kaleidoscope'
import warpSrc from './shaders/warp'
import plasmaSrc from './shaders/plasma'
import magneticSrc from './shaders/magnetic'
import synthwaveSrc from './shaders/synthwave'
import dnaSrc from './shaders/dna'
import crystalSrc from './shaders/crystal'

export interface Visualization {
  id: string
  name: string
  shader: string
}

export const VISUALIZATIONS: Visualization[] = [
  { id: 'aurora',       name: 'Aurora',          shader: auroraSrc },
  { id: 'pulse',        name: 'Pulse',            shader: pulseSrc },
  { id: 'nebula',       name: 'Nebula',           shader: nebulaSrc },
  { id: 'lava',         name: 'Lava Lamp',        shader: lavaSrc },
  { id: 'kaleidoscope', name: 'Kaleidoscoop',     shader: kaleidoscopeSrc },
  { id: 'warp',         name: 'Warp Tunnel',      shader: warpSrc },
  { id: 'plasma',       name: 'Plasma',           shader: plasmaSrc },
  { id: 'magnetic',     name: 'Magnetisch Veld',  shader: magneticSrc },
  { id: 'synthwave',    name: 'Synthwave',        shader: synthwaveSrc },
  { id: 'dna',          name: 'DNA Helix',        shader: dnaSrc },
  { id: 'crystal',      name: 'Kristal',          shader: crystalSrc },
]
