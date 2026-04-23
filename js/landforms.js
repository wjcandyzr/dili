import * as THREE from 'three';
import { fbm, valueNoise2D, ridge } from './noise.js';
import { makeLava, makeRiverPath } from './terrain.js';

// Color palettes
const palettes = {
  alpine: [
    { h: 0.0, color: '#2a4d6e' },
    { h: 0.15, color: '#4a7a4a' },
    { h: 0.35, color: '#7a9a5a' },
    { h: 0.6, color: '#8a7a5a' },
    { h: 0.8, color: '#b0a898' },
    { h: 1.0, color: '#ffffff' },
  ],
  plateau: [
    { h: 0.0, color: '#6b8a4a' },
    { h: 0.3, color: '#a8965a' },
    { h: 0.7, color: '#c2a878' },
    { h: 1.0, color: '#d8c7a0' },
  ],
  hill: [
    { h: 0.0, color: '#5a8048' },
    { h: 0.5, color: '#86a45c' },
    { h: 1.0, color: '#c0b870' },
  ],
  plain: [
    { h: 0.0, color: '#6e9a58' },
    { h: 0.5, color: '#88b066' },
    { h: 1.0, color: '#a8c278' },
  ],
  basin: [
    { h: 0.0, color: '#8a7050' },
    { h: 0.35, color: '#b49868' },
    { h: 0.7, color: '#9a7a4a' },
    { h: 1.0, color: '#6a553a' },
  ],
  volcano: [
    { h: 0.0, color: '#3a2f28' },
    { h: 0.5, color: '#5a3a2a' },
    { h: 0.85, color: '#8a4a2a' },
    { h: 1.0, color: '#c04020' },
  ],
  canyon: [
    { h: 0.0, color: '#6a3a28' },
    { h: 0.3, color: '#a85a38' },
    { h: 0.6, color: '#c88058' },
    { h: 1.0, color: '#e0b880' },
  ],
  delta: [
    { h: 0.0, color: '#2a6a9a' },
    { h: 0.25, color: '#8a9a6a' },
    { h: 0.6, color: '#a8b070' },
    { h: 1.0, color: '#c4b888' },
  ],
  karst: [
    { h: 0.0, color: '#5a8a5a' },
    { h: 0.3, color: '#8ab090' },
    { h: 0.7, color: '#b0c0b0' },
    { h: 1.0, color: '#e0e0d8' },
  ],
  danxia: [
    { h: 0.0, color: '#6a2a20' },
    { h: 0.3, color: '#b04020' },
    { h: 0.7, color: '#d86840' },
    { h: 1.0, color: '#e89068' },
  ],
  desert: [
    { h: 0.0, color: '#c8a868' },
    { h: 0.5, color: '#e0c080' },
    { h: 1.0, color: '#f0d8a0' },
  ],
  glacier: [
    { h: 0.0, color: '#6a7a8a' },
    { h: 0.25, color: '#a8b8c8' },
    { h: 0.6, color: '#d8e4ec' },
    { h: 1.0, color: '#ffffff' },
  ],
  coast: [
    { h: 0.0, color: '#1e5a8a' },
    { h: 0.3, color: '#7aa878' },
    { h: 0.6, color: '#c0b078' },
    { h: 1.0, color: '#a89868' },
  ],
};

const SIZE = 100;
const SEG = 200;

function dist(x, z, cx = 0, cz = 0) {
  return Math.hypot(x - cx, z - cz);
}

// === 13 Landforms ===

export const landforms = [
  // 1. 山地
  {
    id: 'mountain',
    name: '山地',
    icon: '⛰️',
    description: {
      definition: '海拔一般在 500 米以上、相对高度超过 200 米、地势起伏较大的地区。',
      formation: '主要由内力作用（板块挤压、褶皱、断裂抬升）形成，经长期外力侵蚀雕琢而成。',
      examples: '喜马拉雅山脉、安第斯山脉、秦岭、天山',
      features: ['山峰尖耸陡峭', '海拔高、相对高差大', '多呈脉状延伸', '常有冰川与雪线'],
    },
    terrain: {
      size: SIZE, segments: SEG,
      colorStops: palettes.alpine,
      heightRange: [-2, 16],
      heightFn: (x, z) => {
        const r = ridge(x * 0.035, z * 0.035, { octaves: 5, gain: 0.55 });
        const n = fbm(x * 0.08, z * 0.08, { octaves: 4, gain: 0.5, seed: 7 });
        return r * 14 + n * 1.5;
      },
    },
    labels: [
      { pos: [0, 16, 0], text: '山峰', note: '山体的最高点，顶部尖锐陡峭，常年积雪。' },
      { pos: [18, 4, -15], text: '山脊', note: '山峰之间连接的高地分水线。' },
      { pos: [-8, 2, 14], text: '山谷', note: '两山之间的低洼地带，多发育河流。' },
      { pos: [25, 1.5, 20], text: '山麓', note: '山体与平地交接的过渡地带。' },
    ],
  },

  // 2. 高原
  {
    id: 'plateau',
    name: '高原',
    icon: '🏔️',
    description: {
      definition: '海拔较高（一般在 500 米以上）、顶面较平坦、边缘陡峭的大面积高地。',
      formation: '大面积地壳隆升后顶面长期未被强烈侵蚀，保留大致平坦的原面。',
      examples: '青藏高原、云贵高原、黄土高原、巴西高原',
      features: ['面积广阔', '顶面起伏较小', '边缘常有陡崖', '海拔高但相对高度小'],
    },
    terrain: {
      size: SIZE, segments: SEG,
      colorStops: palettes.plateau,
      heightRange: [-1, 10],
      heightFn: (x, z) => {
        const d = dist(x, z) / 50;
        const edge = Math.min(1, Math.max(0, 1.15 - d * 1.1));
        const top = fbm(x * 0.05, z * 0.05, { octaves: 3, gain: 0.4 }) * 0.8;
        const base = edge * 8;
        // sharp edge drop
        const cliff = edge > 0.1 ? 0 : (0.1 - edge) * -10;
        return base + top + cliff;
      },
    },
    labels: [
      { pos: [0, 9, 0], text: '高原面', note: '顶部相对平坦的大面积高地，起伏较小。' },
      { pos: [35, 2, 0], text: '陡崖', note: '高原边缘突然下降形成的陡峭崖壁。' },
      { pos: [-20, 8.5, 18], text: '原面起伏', note: '高原面被流水切割后形成的缓波状地形。' },
    ],
  },

  // 3. 丘陵
  {
    id: 'hill',
    name: '丘陵',
    icon: '🌄',
    description: {
      definition: '海拔一般在 500 米以下，相对高度不超过 200 米，坡度较缓的低矮起伏地形。',
      formation: '多为山地长期受风化、侵蚀、夷平作用后形成，或由轻微地壳抬升造成。',
      examples: '东南丘陵、辽东丘陵、山东丘陵',
      features: ['海拔较低', '坡度平缓', '相对高度小', '山顶浑圆'],
    },
    terrain: {
      size: SIZE, segments: SEG,
      colorStops: palettes.hill,
      heightRange: [-1, 6],
      heightFn: (x, z) => {
        const n = fbm(x * 0.06, z * 0.06, { octaves: 4, gain: 0.5 });
        return n * 4 + 1;
      },
    },
    labels: [
      { pos: [12, 5, 8], text: '浑圆山丘', note: '长期风化侵蚀使山顶变得圆润平缓。' },
      { pos: [-15, 2, -10], text: '缓坡', note: '丘陵坡度较缓，适合开发梯田与茶园。' },
    ],
  },

  // 4. 平原
  {
    id: 'plain',
    name: '平原',
    icon: '🟩',
    description: {
      definition: '海拔一般在 200 米以下，地势低平、起伏很小的广阔地区。',
      formation: '主要由河流冲积、湖积或海积作用形成；地壳长期缓慢沉降后被沉积物填平。',
      examples: '东北平原、华北平原、长江中下游平原、亚马孙平原',
      features: ['地势低平', '起伏微弱', '土层深厚', '农业发达'],
    },
    terrain: {
      size: SIZE, segments: SEG,
      colorStops: palettes.plain,
      heightRange: [-0.5, 1.5],
      heightFn: (x, z) => {
        return fbm(x * 0.05, z * 0.05, { octaves: 3, gain: 0.3 }) * 0.6 + 0.2;
      },
    },
    labels: [
      { pos: [0, 1.2, 0], text: '平坦原面', note: '地势低平，海拔多在 200 米以下。' },
      { pos: [20, 1.1, -15], text: '微起伏', note: '平原并非绝对平整，存在微小波状起伏。' },
    ],
  },

  // 5. 盆地
  {
    id: 'basin',
    name: '盆地',
    icon: '🥣',
    description: {
      definition: '四周高、中间低，被山地或高原环绕的低洼地形。',
      formation: '地壳断裂下陷，或周围长期隆升而中央相对稳定，再经河湖沉积填平底部。',
      examples: '四川盆地、塔里木盆地、柴达木盆地、准噶尔盆地',
      features: ['四周高中间低', '底部常较平坦', '常有湖泊或沙漠', '气候具封闭性'],
    },
    terrain: {
      size: SIZE, segments: SEG,
      colorStops: palettes.basin,
      heightRange: [-4, 10],
      heightFn: (x, z) => {
        const d = dist(x, z) / 50;
        const rim = Math.pow(d, 2.5) * 10;
        const floor = fbm(x * 0.08, z * 0.08, { octaves: 3 }) * 0.6;
        return rim - 3 + floor;
      },
    },
    labels: [
      { pos: [0, -2.5, 0], text: '盆底', note: '盆地中央地势最低，常有湖泊或河流汇聚。' },
      { pos: [30, 7, 20], text: '山地边缘', note: '四周由山地或高原围成封闭形态。' },
    ],
  },

  // 6. 火山
  {
    id: 'volcano',
    name: '火山',
    icon: '🌋',
    description: {
      definition: '地下岩浆沿地壳薄弱处喷出地表形成的锥状或盾状山体。',
      formation: '板块边界或地幔柱处，岩浆上涌冲破地壳，反复喷发堆积熔岩与火山碎屑。',
      examples: '日本富士山、长白山天池、意大利维苏威、夏威夷基拉韦厄',
      features: ['锥形山体', '顶部有火山口', '坡面呈放射状', '岩浆流痕明显'],
    },
    terrain: (() => {
      const extras = [makeLava(2.2, 10.2)];
      return {
        size: SIZE, segments: SEG,
        colorStops: palettes.volcano,
        heightRange: [0, 14],
        extras,
        heightFn: (x, z) => {
          const d = dist(x, z);
          const cone = Math.max(0, 14 - d * 0.55);
          const crater = d < 3 ? -(3 - d) * 1.3 : 0;
          const n = fbm(x * 0.15, z * 0.15, { octaves: 4, gain: 0.5 }) * 0.6;
          return cone + crater + n;
        },
      };
    })(),
    labels: [
      { pos: [0, 11, 0], text: '火山口', note: '岩浆喷发的通道口，常呈漏斗形凹陷。' },
      { pos: [10, 6, 10], text: '火山锥', note: '熔岩和火山碎屑层层堆积形成的山体。' },
      { pos: [20, 2, -18], text: '熔岩流', note: '岩浆沿坡面放射状流下，冷却形成熔岩台地。' },
    ],
  },

  // 7. 峡谷
  {
    id: 'canyon',
    name: '峡谷',
    icon: '🏜️',
    description: {
      definition: '两侧陡峭、深而狭长的谷地，多由河流长期下切侵蚀形成。',
      formation: '地壳抬升后河流持续下切侵蚀，加上岩性差异使谷壁保持陡峭。',
      examples: '雅鲁藏布大峡谷、美国科罗拉多大峡谷、长江三峡、虎跳峡',
      features: ['谷壁陡峭', '深度远大于宽度', '岩层层理明显', '河流湍急'],
    },
    terrain: {
      size: SIZE, segments: SEG,
      colorStops: palettes.canyon,
      heightRange: [-6, 10],
      heightFn: (x, z) => {
        // meandering canyon along z axis
        const centerX = Math.sin(z * 0.05) * 8 + Math.sin(z * 0.12) * 3;
        const d = Math.abs(x - centerX);
        const canyon = d < 6 ? -(6 - d) * 1.8 : 0;
        const base = 8 + fbm(x * 0.04, z * 0.04, { octaves: 4 }) * 1.5;
        // layered strata (step look)
        const strata = Math.floor(((base + canyon) * 0.8)) * 0.3;
        return base + canyon + strata * 0.5;
      },
    },
    labels: [
      { pos: [0, -2, 0], text: '谷底', note: '峡谷底部常为河流通道，侵蚀持续进行。' },
      { pos: [12, 8, 10], text: '陡壁', note: '两侧几乎垂直的岩壁，显示明显层理。' },
      { pos: [-14, 9, -15], text: '台地', note: '峡谷两侧未被侵蚀的原面，形成阶梯状台地。' },
    ],
  },

  // 8. 河流三角洲
  {
    id: 'delta',
    name: '河流三角洲',
    icon: '🌊',
    description: {
      definition: '河流入海或入湖处，泥沙堆积形成的三角形或扇形冲积平原。',
      formation: '河流在入海口流速骤减，所携带的泥沙大量沉积，不断向海推进形成扇状陆地。',
      examples: '长江三角洲、珠江三角洲、尼罗河三角洲、密西西比河三角洲',
      features: ['扇形或鸟足状', '地势低平', '河网密布', '土壤肥沃'],
    },
    terrain: (() => {
      const river = makeRiverPath([
        [0, 0.5, -48], [0, 0.4, -20], [-4, 0.35, -5],
        [-14, 0.3, 10], [-24, 0.25, 25],
      ]);
      const river2 = makeRiverPath([
        [0, 0.4, -20], [4, 0.35, -5], [14, 0.3, 12], [26, 0.25, 28],
      ]);
      const river3 = makeRiverPath([
        [-4, 0.35, -5], [-2, 0.3, 12], [2, 0.25, 30],
      ]);
      return {
        size: SIZE, segments: SEG,
        colorStops: palettes.delta,
        heightRange: [-1, 6],
        water: { level: -0.4, color: '#2b6fa0' },
        extras: [river, river2, river3],
        heightFn: (x, z) => {
          // apex at (0,-48), fans toward +z
          const apexZ = -48;
          const along = (z - apexZ) / 90; // 0 at apex, ~1 at far end
          const fanEdge = 6 + along * 40;
          const lateral = Math.abs(x);
          if (along < 0) return 4 + fbm(x * 0.05, z * 0.05) * 0.3;
          if (lateral > fanEdge) return -0.8;
          const h = 4 - along * 4.5 + fbm(x * 0.08, z * 0.08, { octaves: 3 }) * 0.3;
          return Math.max(h, -0.6);
        },
      };
    })(),
    labels: [
      { pos: [0, 4.5, -45], text: '顶点', note: '三角洲的起始点，河流分叉处。' },
      { pos: [-20, 0.5, 25], text: '汊河', note: '河流分支形成放射状水系。' },
      { pos: [20, 0, 30], text: '沉积平原', note: '泥沙大量堆积形成肥沃的低平陆地。' },
    ],
  },

  // 9. 喀斯特（岩溶）
  {
    id: 'karst',
    name: '喀斯特',
    icon: '🗻',
    description: {
      definition: '可溶性岩石（主要为石灰岩）被含二氧化碳的水长期溶蚀形成的特殊地貌。',
      formation: '雨水溶解石灰岩中的碳酸钙，沿节理和裂隙不断侵蚀形成峰林、溶洞、天坑、石林等。',
      examples: '桂林山水、云南石林、贵州荔波、斯洛文尼亚喀斯特高原',
      features: ['孤峰林立', '溶洞发育', '地表崎岖', '地下暗河众多'],
    },
    terrain: (() => {
      // Poisson-ish scattered peaks
      const peaks = [];
      let seed = 12345;
      const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      for (let i = 0; i < 32; i++) {
        peaks.push({
          x: (rand() - 0.5) * 80,
          z: (rand() - 0.5) * 80,
          r: 3 + rand() * 3,
          h: 5 + rand() * 6,
        });
      }
      return {
        size: SIZE, segments: SEG,
        colorStops: palettes.karst,
        heightRange: [-0.5, 11],
        water: { level: -0.3, color: '#4a9abc' },
        heightFn: (x, z) => {
          let h = 0.2 + fbm(x * 0.04, z * 0.04, { octaves: 3 }) * 0.4;
          for (const p of peaks) {
            const d = dist(x, z, p.x, p.z);
            if (d < p.r * 1.5) {
              const t = Math.max(0, 1 - d / (p.r * 1.5));
              h = Math.max(h, p.h * Math.pow(t, 1.8));
            }
          }
          return h;
        },
      };
    })(),
    labels: [
      { pos: [0, 11, 0], text: '孤峰', note: '溶蚀残留的塔状山峰，四周为平原。' },
      { pos: [-20, 0.5, 20], text: '溶蚀平原', note: '石灰岩被溶蚀后形成的低平地面。' },
      { pos: [20, 8, -18], text: '峰林', note: '成群分布的锥状或塔状灰岩山峰。' },
    ],
  },

  // 10. 丹霞
  {
    id: 'danxia',
    name: '丹霞',
    icon: '🟥',
    description: {
      definition: '红色砂砾岩经流水侵蚀、重力崩塌等作用形成的赤壁丹崖地貌。',
      formation: '巨厚红色砂砾岩层被节理切割，经流水侵蚀和重力崩塌，形成方山、石柱、石墙等。',
      examples: '丹霞山（广东）、龙虎山（江西）、崀山（湖南）、张掖七彩丹霞',
      features: ['赤壁丹崖', '方山石墙', '顶平身陡麓缓', '色彩鲜艳'],
    },
    terrain: (() => {
      let seed = 555;
      const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      const mesas = [];
      for (let i = 0; i < 18; i++) {
        mesas.push({
          cx: (rand() - 0.5) * 70,
          cz: (rand() - 0.5) * 70,
          rx: 4 + rand() * 6,
          rz: 4 + rand() * 6,
          h: 5 + rand() * 5,
        });
      }
      return {
        size: SIZE, segments: SEG,
        colorStops: palettes.danxia,
        heightRange: [0, 11],
        heightFn: (x, z) => {
          let h = 0.5 + fbm(x * 0.06, z * 0.06, { octaves: 3 }) * 0.5;
          for (const m of mesas) {
            const dx = (x - m.cx) / m.rx;
            const dz = (z - m.cz) / m.rz;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < 1) {
              // flat top with sharp cliff — smooth near edge
              const top = m.h * (1 - Math.pow(d, 8) * 0.1);
              h = Math.max(h, top);
            } else if (d < 1.15) {
              // cliff drop
              const t = (1.15 - d) / 0.15;
              h = Math.max(h, m.h * t * 0.4);
            }
          }
          return h;
        },
      };
    })(),
    labels: [
      { pos: [0, 10, 0], text: '方山', note: '顶部平坦、四周陡崖的红色台地。' },
      { pos: [20, 6, 15], text: '赤壁', note: '垂直的红色崖壁，是丹霞最典型的特征。' },
      { pos: [-22, 1, -20], text: '红层', note: '水平层理明显的红色砂砾岩层。' },
    ],
  },

  // 11. 沙漠
  {
    id: 'desert',
    name: '沙漠',
    icon: '🏖️',
    description: {
      definition: '气候干旱、植被稀少、地表被大量沙粒覆盖的地区。',
      formation: '常年干旱少雨，岩石风化破碎为沙，风力搬运堆积形成各种沙丘。',
      examples: '塔克拉玛干沙漠、撒哈拉沙漠、戈壁、巴丹吉林沙漠',
      features: ['沙丘连绵', '风成地貌显著', '干旱少雨', '昼夜温差大'],
    },
    terrain: {
      size: SIZE, segments: SEG,
      colorStops: palettes.desert,
      heightRange: [0, 5],
      heightFn: (x, z) => {
        // barchan-like dunes: asymmetric waves
        const wave = Math.sin(x * 0.12 + Math.sin(z * 0.06) * 2) * 1.5;
        const wave2 = Math.sin(z * 0.08 + x * 0.03) * 1.0;
        const grain = fbm(x * 0.25, z * 0.25, { octaves: 3 }) * 0.4;
        return 2 + wave + wave2 * 0.6 + grain;
      },
    },
    labels: [
      { pos: [0, 4.5, 0], text: '沙丘', note: '风力堆积形成的沙山，迎风坡缓、背风坡陡。' },
      { pos: [-18, 1, 15], text: '丘间低地', note: '两沙丘之间相对平缓的低洼地带。' },
      { pos: [20, 3.5, -20], text: '沙垄', note: '呈长条状延伸的线形沙丘。' },
    ],
  },

  // 12. 冰川
  {
    id: 'glacier',
    name: '冰川',
    icon: '🧊',
    description: {
      definition: '在高海拔或高纬度地区由积雪长期压实形成并能缓慢运动的巨大冰体。',
      formation: '积雪逐年累积、压实重结晶为粒雪再变成冰川冰，在重力作用下沿山谷缓慢流动。',
      examples: '喜马拉雅冰川、阿尔卑斯冰川、格陵兰冰盖、南极冰盖',
      features: ['终年积雪', '有明显冰舌', '发育冰斗、U 形谷', '刻蚀地表'],
    },
    terrain: {
      size: SIZE, segments: SEG,
      colorStops: palettes.glacier,
      heightRange: [0, 14],
      heightFn: (x, z) => {
        // U-shaped valley along z axis, with glacier tongue flowing
        const ridgeR = ridge(x * 0.04, z * 0.04, { octaves: 4, gain: 0.5 });
        const base = ridgeR * 12;
        // carve a U-valley in the middle strip
        const valleyStrength = Math.max(0, 1 - Math.abs(x) / 12);
        const uFloor = Math.pow(Math.abs(x) / 12, 2) * 6;
        const carved = valleyStrength > 0.1 ? uFloor + 1 : base;
        const h = valleyStrength > 0.1 ? Math.min(base, carved) : base;
        // add ice crevasse lines
        const crev = Math.sin(z * 0.4) * 0.15 * valleyStrength;
        return h + crev + 0.5;
      },
    },
    labels: [
      { pos: [0, 1.5, 40], text: '冰舌', note: '冰川末端向低处延伸的舌状部分。' },
      { pos: [-18, 12, -10], text: '雪线以上', note: '常年积雪区，冰川发源地。' },
      { pos: [10, 2, 0], text: 'U 形谷', note: '冰川侵蚀形成的宽底陡壁谷地。' },
    ],
  },

  // 13. 海岸
  {
    id: 'coast',
    name: '海岸',
    icon: '🏝️',
    description: {
      definition: '陆地与海洋相互作用的交界地带，受海浪、潮汐、洋流塑造。',
      formation: '海浪的侵蚀与堆积作用长期塑造海岸线，形成海蚀崖、海滩、沙嘴、海湾等。',
      examples: '山东半岛海岸、福建基岩海岸、澳大利亚十二使徒岩、杭州湾',
      features: ['海陆交界', '海浪作用显著', '有海滩与海崖', '形态多样（基岩、砂质、泥质）'],
    },
    terrain: {
      size: SIZE, segments: SEG,
      colorStops: palettes.coast,
      heightRange: [-3, 8],
      water: { level: 0, color: '#1e6aa0' },
      heightFn: (x, z) => {
        // land on +z half, ocean on -z half, curved coastline
        const coastZ = Math.sin(x * 0.08) * 5 - 5;
        const inland = z - coastZ;
        if (inland < 0) {
          // underwater slope
          return Math.max(-2.5, inland * 0.08);
        }
        // land: beach then rise
        const beach = Math.min(1, inland / 8);
        const hills = fbm(x * 0.05, z * 0.05, { octaves: 4, gain: 0.5 });
        const h = beach * 1 + Math.max(0, (inland - 8)) * 0.08 + hills * 2 * Math.min(1, inland / 15);
        return h;
      },
    },
    labels: [
      { pos: [0, 0.2, -5], text: '海岸线', note: '海水与陆地的分界线，随潮汐往复变化。' },
      { pos: [-20, 0.5, 5], text: '海滩', note: '海浪堆积形成的砂砾地带。' },
      { pos: [20, 5, 25], text: '海岸丘陵', note: '近海的基岩山地，常形成海蚀崖。' },
      { pos: [0, -1.5, -30], text: '浅海', note: '大陆架上水深较浅的海域。' },
    ],
  },
];

export function getLandform(id) {
  return landforms.find(l => l.id === id);
}
