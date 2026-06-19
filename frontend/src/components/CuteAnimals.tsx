import React from 'react';

// 所有可爱动物的SVG组件
const animals = [
  // 柯基
  {
    name: '柯基',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 身体 */}
        <ellipse cx="80" cy="95" rx="45" ry="35" fill="#F4A460"/>
        <ellipse cx="80" cy="100" rx="35" ry="20" fill="#FFDAB9"/>
        {/* 头 */}
        <circle cx="80" cy="45" r="30" fill="#F4A460"/>
        {/* 脸部白色 */}
        <ellipse cx="80" cy="50" rx="20" ry="18" fill="#FFDAB9"/>
        {/* 大耳朵 */}
        <ellipse cx="48" cy="25" rx="14" ry="18" fill="#F4A460" transform="rotate(-15 48 25)"/>
        <ellipse cx="112" cy="25" rx="14" ry="18" fill="#F4A460" transform="rotate(15 112 25)"/>
        <ellipse cx="50" cy="25" rx="8" ry="12" fill="#FFB6C1" transform="rotate(-15 50 25)"/>
        <ellipse cx="110" cy="25" rx="8" ry="12" fill="#FFB6C1" transform="rotate(15 110 25)"/>
        {/* 眼睛 */}
        <circle cx="68" cy="42" r="5" fill="#2d2d2d"/>
        <circle cx="92" cy="42" r="5" fill="#2d2d2d"/>
        <circle cx="70" cy="40" r="2" fill="white"/>
        <circle cx="94" cy="40" r="2" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="52" rx="5" ry="3.5" fill="#2d2d2d"/>
        {/* 嘴巴 */}
        <path d="M74 57 Q80 63 86 57" stroke="#2d2d2d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* 腮红 */}
        <ellipse cx="60" cy="52" rx="6" ry="3.5" fill="#FFB6C1" opacity="0.5"/>
        <ellipse cx="100" cy="52" rx="6" ry="3.5" fill="#FFB6C1" opacity="0.5"/>
        {/* 短腿 */}
        <rect x="50" y="120" width="12" height="15" rx="6" fill="#F4A460"/>
        <rect x="98" y="120" width="12" height="15" rx="6" fill="#F4A460"/>
        <ellipse cx="56" cy="137" rx="8" ry="5" fill="#FFDAB9"/>
        <ellipse cx="104" cy="137" rx="8" ry="5" fill="#FFDAB9"/>
        {/* 小尾巴 */}
        <circle cx="125" cy="85" r="8" fill="#F4A460"/>
      </svg>
    ),
  },
  // 萨摩耶
  {
    name: '萨摩耶',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 蓬松身体 */}
        <ellipse cx="80" cy="100" rx="45" ry="35" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        <ellipse cx="60" cy="95" rx="20" ry="15" fill="#fafafa"/>
        <ellipse cx="100" cy="95" rx="20" ry="15" fill="#fafafa"/>
        {/* 头 */}
        <ellipse cx="80" cy="45" rx="32" ry="28" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        <ellipse cx="60" cy="45" rx="15" ry="16" fill="#fafafa"/>
        <ellipse cx="100" cy="45" rx="15" ry="16" fill="#fafafa"/>
        {/* 三角耳朵 */}
        <path d="M52 25 L42 5 L65 20 Z" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        <path d="M108 25 L118 5 L95 20 Z" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        <path d="M55 23 L47 9 L63 21 Z" fill="#FFE4E6"/>
        <path d="M105 23 L113 9 L97 21 Z" fill="#FFE4E6"/>
        {/* 眼睛 */}
        <ellipse cx="68" cy="42" rx="5" ry="4.5" fill="#2d2d2d"/>
        <ellipse cx="92" cy="42" rx="5" ry="4.5" fill="#2d2d2d"/>
        <circle cx="70" cy="40" r="1.8" fill="white"/>
        <circle cx="94" cy="40" r="1.8" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="52" rx="5" ry="3.5" fill="#1a1a1a"/>
        {/* 微笑 */}
        <path d="M72 56 Q80 63 88 56" stroke="#4a4a4a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* 腮红 */}
        <ellipse cx="58" cy="50" rx="6" ry="3.5" fill="#FFB6C1" opacity="0.4"/>
        <ellipse cx="102" cy="50" rx="6" ry="3.5" fill="#FFB6C1" opacity="0.4"/>
        {/* 前爪 */}
        <ellipse cx="55" cy="130" rx="12" ry="8" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        <ellipse cx="105" cy="130" rx="12" ry="8" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        {/* 蓬松尾巴 */}
        <path d="M125 85 Q145 70 140 90 Q150 75 145 100" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  // 柴犬
  {
    name: '柴犬',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 身体 */}
        <ellipse cx="80" cy="100" rx="40" ry="32" fill="#D2691E"/>
        <ellipse cx="80" cy="105" rx="30" ry="18" fill="#FFDAB9"/>
        {/* 头 */}
        <circle cx="80" cy="45" r="30" fill="#D2691E"/>
        {/* 脸部白色 */}
        <ellipse cx="80" cy="50" rx="18" ry="16" fill="#FFDAB9"/>
        {/* 三角耳朵 */}
        <path d="M50 28 L42 8 L62 22 Z" fill="#D2691E"/>
        <path d="M110 28 L118 8 L98 22 Z" fill="#D2691E"/>
        <path d="M53 26 L47 12 L60 23 Z" fill="#FFE4E6"/>
        <path d="M107 26 L113 12 L100 23 Z" fill="#FFE4E6"/>
        {/* 眼睛 */}
        <circle cx="68" cy="42" r="4.5" fill="#2d2d2d"/>
        <circle cx="92" cy="42" r="4.5" fill="#2d2d2d"/>
        <circle cx="70" cy="40" r="1.5" fill="white"/>
        <circle cx="94" cy="40" r="1.5" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="52" rx="5" ry="3.5" fill="#1a1a1a"/>
        {/* 嘴巴 - 柴犬微笑 */}
        <path d="M72 56 Q80 62 88 56" stroke="#2d2d2d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M80 52 L80 56" stroke="#2d2d2d" strokeWidth="1"/>
        {/* 腮红 */}
        <ellipse cx="58" cy="50" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        <ellipse cx="102" cy="50" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        {/* 腿 */}
        <rect x="52" y="122" width="10" height="14" rx="5" fill="#D2691E"/>
        <rect x="98" y="122" width="10" height="14" rx="5" fill="#D2691E"/>
        {/* 卷尾巴 */}
        <path d="M120 80 Q135 65 130 85 Q140 70 135 95" stroke="#D2691E" strokeWidth="8" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  // 金毛
  {
    name: '金毛',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 身体 */}
        <ellipse cx="80" cy="100" rx="42" ry="33" fill="#DAA520"/>
        <ellipse cx="80" cy="105" rx="32" ry="18" fill="#F0D58C"/>
        {/* 头 */}
        <ellipse cx="80" cy="45" rx="30" ry="28" fill="#DAA520"/>
        <ellipse cx="80" cy="50" rx="20" ry="16" fill="#F0D58C"/>
        {/* 垂耳朵 */}
        <ellipse cx="48" cy="38" rx="10" ry="20" fill="#C8961E" transform="rotate(-10 48 38)"/>
        <ellipse cx="112" cy="38" rx="10" ry="20" fill="#C8961E" transform="rotate(10 112 38)"/>
        {/* 眼睛 */}
        <circle cx="68" cy="42" r="5" fill="#2d2d2d"/>
        <circle cx="92" cy="42" r="5" fill="#2d2d2d"/>
        <circle cx="70" cy="40" r="2" fill="white"/>
        <circle cx="94" cy="40" r="2" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="52" rx="6" ry="4" fill="#1a1a1a"/>
        {/* 嘴巴 */}
        <path d="M72 57 Q80 64 88 57" stroke="#4a4a4a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* 腮红 */}
        <ellipse cx="58" cy="50" rx="6" ry="3" fill="#FFB6C1" opacity="0.4"/>
        <ellipse cx="102" cy="50" rx="6" ry="3" fill="#FFB6C1" opacity="0.4"/>
        {/* 腿 */}
        <rect x="52" y="122" width="10" height="14" rx="5" fill="#DAA520"/>
        <rect x="98" y="122" width="10" height="14" rx="5" fill="#DAA520"/>
        {/* 尾巴 */}
        <path d="M122 85 Q140 75 135 95 Q145 80 140 105" stroke="#DAA520" strokeWidth="8" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  // 比熊
  {
    name: '比熊',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 蓬松身体 */}
        <ellipse cx="80" cy="100" rx="40" ry="32" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        <circle cx="60" cy="90" r="15" fill="#fafafa"/>
        <circle cx="100" cy="90" r="15" fill="#fafafa"/>
        <circle cx="80" cy="85" r="15" fill="#fafafa"/>
        {/* 蓬松的头 */}
        <circle cx="80" cy="45" r="32" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        <circle cx="60" cy="38" r="12" fill="#fafafa"/>
        <circle cx="100" cy="38" r="12" fill="#fafafa"/>
        <circle cx="80" cy="32" r="12" fill="#fafafa"/>
        <circle cx="70" cy="50" r="10" fill="#fafafa"/>
        <circle cx="90" cy="50" r="10" fill="#fafafa"/>
        {/* 小耳朵 */}
        <ellipse cx="50" cy="40" rx="8" ry="10" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        <ellipse cx="110" cy="40" rx="8" ry="10" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        {/* 眼睛 - 被毛发半遮 */}
        <circle cx="72" cy="45" r="4" fill="#2d2d2d"/>
        <circle cx="88" cy="45" r="4" fill="#2d2d2d"/>
        <circle cx="73.5" cy="43.5" r="1.5" fill="white"/>
        <circle cx="89.5" cy="43.5" r="1.5" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="53" rx="4" ry="3" fill="#1a1a1a"/>
        {/* 嘴巴 */}
        <path d="M76 56 Q80 60 84 56" stroke="#4a4a4a" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        {/* 腮红 */}
        <ellipse cx="62" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        <ellipse cx="98" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        {/* 小爪子 */}
        <ellipse cx="55" cy="130" rx="10" ry="7" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
        <ellipse cx="105" cy="130" rx="10" ry="7" fill="white" stroke="#f0e6e6" strokeWidth="1"/>
      </svg>
    ),
  },
  // 哈士奇
  {
    name: '哈士奇',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 身体 */}
        <ellipse cx="80" cy="100" rx="40" ry="32" fill="#708090"/>
        <ellipse cx="80" cy="105" rx="30" ry="18" fill="#E8E8E8"/>
        {/* 头 */}
        <ellipse cx="80" cy="45" rx="30" ry="28" fill="#708090"/>
        {/* 脸部白色 */}
        <ellipse cx="80" cy="50" rx="18" ry="18" fill="#E8E8E8"/>
        {/* 额头白色标记 */}
        <path d="M72 25 L80 35 L88 25 L85 18 L75 18 Z" fill="#E8E8E8"/>
        {/* 三角耳朵 */}
        <path d="M50 25 L40 5 L62 20 Z" fill="#708090"/>
        <path d="M110 25 L120 5 L98 20 Z" fill="#708090"/>
        <path d="M53 23 L46 9 L60 21 Z" fill="#FFE4E6"/>
        <path d="M107 23 L114 9 L100 21 Z" fill="#FFE4E6"/>
        {/* 蓝色眼睛 - 哈士奇特征 */}
        <circle cx="68" cy="42" r="5" fill="#4169E1"/>
        <circle cx="92" cy="42" r="5" fill="#4169E1"/>
        <circle cx="68" cy="42" r="2.5" fill="#1a1a5e"/>
        <circle cx="92" cy="42" r="2.5" fill="#1a1a5e"/>
        <circle cx="70" cy="40" r="1.5" fill="white"/>
        <circle cx="94" cy="40" r="1.5" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="52" rx="5" ry="3.5" fill="#1a1a1a"/>
        {/* 嘴巴 - 哈士奇表情 */}
        <path d="M72 57 Q80 62 88 57" stroke="#4a4a4a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* 腮红 */}
        <ellipse cx="58" cy="50" rx="5" ry="3" fill="#FFB6C1" opacity="0.4"/>
        <ellipse cx="102" cy="50" rx="5" ry="3" fill="#FFB6C1" opacity="0.4"/>
        {/* 腿 */}
        <rect x="52" y="122" width="10" height="14" rx="5" fill="#708090"/>
        <rect x="98" y="122" width="10" height="14" rx="5" fill="#708090"/>
        {/* 尾巴 */}
        <path d="M120 80 Q138 68 132 88 Q142 72 138 100" stroke="#708090" strokeWidth="7" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  // 橘猫
  {
    name: '橘猫',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 身体 */}
        <ellipse cx="80" cy="100" rx="40" ry="32" fill="#FF8C00"/>
        <ellipse cx="80" cy="105" rx="30" ry="18" fill="#FFD700"/>
        {/* 条纹 */}
        <path d="M55 90 Q65 85 75 90" stroke="#E07000" strokeWidth="2" fill="none"/>
        <path d="M85 88 Q95 83 105 88" stroke="#E07000" strokeWidth="2" fill="none"/>
        {/* 头 */}
        <circle cx="80" cy="45" r="30" fill="#FF8C00"/>
        {/* 脸部白色 */}
        <ellipse cx="80" cy="50" rx="16" ry="14" fill="#FFD700"/>
        {/* 猫耳朵 */}
        <path d="M50 28 L42 5 L62 22 Z" fill="#FF8C00"/>
        <path d="M110 28 L118 5 L98 22 Z" fill="#FF8C00"/>
        <path d="M53 26 L47 10 L60 23 Z" fill="#FFB6C1"/>
        <path d="M107 26 L113 10 L100 23 Z" fill="#FFB6C1"/>
        {/* 眼睛 */}
        <ellipse cx="68" cy="42" rx="5" ry="5.5" fill="#2d2d2d"/>
        <ellipse cx="92" cy="42" rx="5" ry="5.5" fill="#2d2d2d"/>
        <circle cx="70" cy="40" r="2" fill="#FFD700"/>
        <circle cx="94" cy="40" r="2" fill="#FFD700"/>
        <circle cx="71" cy="39" r="1" fill="white"/>
        <circle cx="95" cy="39" r="1" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="52" rx="4" ry="3" fill="#FF69B4"/>
        {/* 嘴巴 */}
        <path d="M75 55 Q80 59 85 55" stroke="#2d2d2d" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        {/* 胡须 */}
        <line x1="48" y1="48" x2="65" y2="50" stroke="#2d2d2d" strokeWidth="1"/>
        <line x1="48" y1="53" x2="65" y2="53" stroke="#2d2d2d" strokeWidth="1"/>
        <line x1="95" y1="50" x2="112" y2="48" stroke="#2d2d2d" strokeWidth="1"/>
        <line x1="95" y1="53" x2="112" y2="53" stroke="#2d2d2d" strokeWidth="1"/>
        {/* 腮红 */}
        <ellipse cx="58" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        <ellipse cx="102" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        {/* 腿 */}
        <rect x="52" y="122" width="10" height="14" rx="5" fill="#FF8C00"/>
        <rect x="98" y="122" width="10" height="14" rx="5" fill="#FF8C00"/>
        {/* 尾巴 */}
        <path d="M120 85 Q140 70 135 90 Q148 75 142 100" stroke="#FF8C00" strokeWidth="8" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  // 英短
  {
    name: '英短',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 身体 */}
        <ellipse cx="80" cy="100" rx="42" ry="34" fill="#A9A9A9"/>
        <ellipse cx="80" cy="105" rx="32" ry="18" fill="#D3D3D3"/>
        {/* 头 - 圆脸 */}
        <circle cx="80" cy="48" r="32" fill="#A9A9A9"/>
        {/* 脸部 */}
        <circle cx="80" cy="52" r="20" fill="#D3D3D3"/>
        {/* 条纹 */}
        <path d="M65 30 L70 38" stroke="#808080" strokeWidth="2"/>
        <path d="M80 28 L80 36" stroke="#808080" strokeWidth="2"/>
        <path d="M95 30 L90 38" stroke="#808080" strokeWidth="2"/>
        {/* 猫耳朵 */}
        <path d="M50 28 L40 5 L62 22 Z" fill="#A9A9A9"/>
        <path d="M110 28 L120 5 L98 22 Z" fill="#A9A9A9"/>
        <path d="M53 26 L45 10 L60 23 Z" fill="#FFB6C1"/>
        <path d="M107 26 L115 10 L100 23 Z" fill="#FFB6C1"/>
        {/* 大圆眼睛 */}
        <circle cx="68" cy="46" r="6" fill="#FFD700"/>
        <circle cx="92" cy="46" r="6" fill="#FFD700"/>
        <circle cx="68" cy="46" r="3" fill="#2d2d2d"/>
        <circle cx="92" cy="46" r="3" fill="#2d2d2d"/>
        <circle cx="70" cy="44" r="1.5" fill="white"/>
        <circle cx="94" cy="44" r="1.5" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="54" rx="4" ry="2.5" fill="#FF69B4"/>
        {/* 嘴巴 */}
        <path d="M76 57 Q80 61 84 57" stroke="#2d2d2d" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        {/* 胡须 */}
        <line x1="46" y1="50" x2="64" y2="52" stroke="#2d2d2d" strokeWidth="1"/>
        <line x1="46" y1="55" x2="64" y2="55" stroke="#2d2d2d" strokeWidth="1"/>
        <line x1="96" y1="52" x2="114" y2="50" stroke="#2d2d2d" strokeWidth="1"/>
        <line x1="96" y1="55" x2="114" y2="55" stroke="#2d2d2d" strokeWidth="1"/>
        {/* 腮红 */}
        <ellipse cx="56" cy="54" rx="5" ry="3" fill="#FFB6C1" opacity="0.4"/>
        <ellipse cx="104" cy="54" rx="5" ry="3" fill="#FFB6C1" opacity="0.4"/>
        {/* 腿 */}
        <rect x="52" y="124" width="10" height="14" rx="5" fill="#A9A9A9"/>
        <rect x="98" y="124" width="10" height="14" rx="5" fill="#A9A9A9"/>
        {/* 粗尾巴 */}
        <path d="M120 85 Q142 72 135 95 Q148 78 140 105" stroke="#A9A9A9" strokeWidth="9" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  // 边牧
  {
    name: '边牧',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 身体 */}
        <ellipse cx="80" cy="100" rx="40" ry="32" fill="#2d2d2d"/>
        <ellipse cx="80" cy="105" rx="30" ry="18" fill="white"/>
        {/* 头 */}
        <circle cx="80" cy="45" r="30" fill="#2d2d2d"/>
        {/* 脸部白色标记 */}
        <path d="M68 30 Q80 50 92 30 L88 20 L72 20 Z" fill="white"/>
        <ellipse cx="80" cy="52" rx="14" ry="12" fill="white"/>
        {/* 耳朵 */}
        <ellipse cx="48" cy="30" rx="10" ry="15" fill="#2d2d2d" transform="rotate(-15 48 30)"/>
        <ellipse cx="112" cy="30" rx="10" ry="15" fill="#2d2d2d" transform="rotate(15 112 30)"/>
        {/* 眼睛 */}
        <circle cx="68" cy="42" r="5" fill="#8B4513"/>
        <circle cx="92" cy="42" r="5" fill="#8B4513"/>
        <circle cx="68" cy="42" r="2.5" fill="#2d2d2d"/>
        <circle cx="92" cy="42" r="2.5" fill="#2d2d2d"/>
        <circle cx="70" cy="40" r="1.5" fill="white"/>
        <circle cx="94" cy="40" r="1.5" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="52" rx="5" ry="3.5" fill="#1a1a1a"/>
        {/* 嘴巴 */}
        <path d="M74 56 Q80 62 86 56" stroke="#4a4a4a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* 腮红 */}
        <ellipse cx="58" cy="50" rx="5" ry="3" fill="#FFB6C1" opacity="0.4"/>
        <ellipse cx="102" cy="50" rx="5" ry="3" fill="#FFB6C1" opacity="0.4"/>
        {/* 腿 */}
        <rect x="52" y="122" width="10" height="14" rx="5" fill="#2d2d2d"/>
        <rect x="98" y="122" width="10" height="14" rx="5" fill="#2d2d2d"/>
        {/* 尾巴 */}
        <path d="M120 82 Q138 70 132 90 Q145 75 140 100" stroke="#2d2d2d" strokeWidth="7" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  // 泰迪
  {
    name: '泰迪',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 蓬松身体 */}
        <ellipse cx="80" cy="100" rx="38" ry="30" fill="#8B4513"/>
        <circle cx="60" cy="92" r="12" fill="#A0522D"/>
        <circle cx="100" cy="92" r="12" fill="#A0522D"/>
        <circle cx="80" cy="88" r="12" fill="#A0522D"/>
        {/* 蓬松的头 */}
        <circle cx="80" cy="42" r="30" fill="#8B4513"/>
        <circle cx="62" cy="35" r="10" fill="#A0522D"/>
        <circle cx="98" cy="35" r="10" fill="#A0522D"/>
        <circle cx="80" cy="30" r="10" fill="#A0522D"/>
        <circle cx="70" cy="45" r="8" fill="#A0522D"/>
        <circle cx="90" cy="45" r="8" fill="#A0522D"/>
        {/* 耳朵 */}
        <ellipse cx="48" cy="38" rx="10" ry="14" fill="#6B3410"/>
        <ellipse cx="112" cy="38" rx="10" ry="14" fill="#6B3410"/>
        {/* 眼睛 */}
        <circle cx="70" cy="42" r="4" fill="#2d2d2d"/>
        <circle cx="90" cy="42" r="4" fill="#2d2d2d"/>
        <circle cx="71.5" cy="40.5" r="1.5" fill="white"/>
        <circle cx="91.5" cy="40.5" r="1.5" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="50" rx="4" ry="3" fill="#1a1a1a"/>
        {/* 嘴巴 */}
        <path d="M76 53 Q80 57 84 53" stroke="#4a4a4a" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        {/* 腮红 */}
        <ellipse cx="60" cy="48" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        <ellipse cx="100" cy="48" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        {/* 小腿 */}
        <ellipse cx="55" cy="128" rx="10" ry="8" fill="#8B4513"/>
        <ellipse cx="105" cy="128" rx="10" ry="8" fill="#8B4513"/>
      </svg>
    ),
  },
  // 布偶猫
  {
    name: '布偶猫',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 蓬松身体 */}
        <ellipse cx="80" cy="100" rx="40" ry="32" fill="#F5F5F5" stroke="#E8E8E8" strokeWidth="1"/>
        <ellipse cx="80" cy="105" rx="30" ry="18" fill="white"/>
        {/* 头 */}
        <circle cx="80" cy="45" r="30" fill="#F5F5F5" stroke="#E8E8E8" strokeWidth="1"/>
        {/* 脸部重点色 */}
        <ellipse cx="65" cy="42" rx="10" ry="12" fill="#D2B48C" opacity="0.4"/>
        <ellipse cx="95" cy="42" rx="10" ry="12" fill="#D2B48C" opacity="0.4"/>
        <ellipse cx="80" cy="50" rx="12" ry="10" fill="white"/>
        {/* 猫耳朵 */}
        <path d="M50 28 L40 5 L62 22 Z" fill="#F5F5F5"/>
        <path d="M110 28 L120 5 L98 22 Z" fill="#F5F5F5"/>
        <path d="M53 26 L45 10 L60 23 Z" fill="#FFB6C1"/>
        <path d="M107 26 L115 10 L100 23 Z" fill="#FFB6C1"/>
        {/* 蓝色大眼睛 */}
        <circle cx="68" cy="42" r="6" fill="#4169E1"/>
        <circle cx="92" cy="42" r="6" fill="#4169E1"/>
        <circle cx="68" cy="42" r="3" fill="#1a1a5e"/>
        <circle cx="92" cy="42" r="3" fill="#1a1a5e"/>
        <circle cx="70" cy="40" r="2" fill="white"/>
        <circle cx="94" cy="40" r="2" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="52" rx="3.5" ry="2.5" fill="#FF69B4"/>
        {/* 嘴巴 */}
        <path d="M76 55 Q80 59 84 55" stroke="#D2B48C" strokeWidth="1" fill="none" strokeLinecap="round"/>
        {/* 胡须 */}
        <line x1="48" y1="48" x2="64" y2="50" stroke="#D2B48C" strokeWidth="0.8"/>
        <line x1="48" y1="53" x2="64" y2="53" stroke="#D2B48C" strokeWidth="0.8"/>
        <line x1="96" y1="50" x2="112" y2="48" stroke="#D2B48C" strokeWidth="0.8"/>
        <line x1="96" y1="53" x2="112" y2="53" stroke="#D2B48C" strokeWidth="0.8"/>
        {/* 腮红 */}
        <ellipse cx="56" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.4"/>
        <ellipse cx="104" cy="52" rx="5" ry="3" fill="#FFB6C1" opacity="0.4"/>
        {/* 小爪子 */}
        <ellipse cx="55" cy="130" rx="10" ry="7" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
        <ellipse cx="105" cy="130" rx="10" ry="7" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
        {/* 蓬松尾巴 */}
        <path d="M120 82 Q142 68 135 90 Q148 72 142 100" stroke="#F5F5F5" strokeWidth="8" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  // 柴犬
  {
    name: '柴犬',
    svg: (
      <svg width="160" height="150" viewBox="0 0 160 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 身体 */}
        <ellipse cx="80" cy="100" rx="40" ry="32" fill="#D2691E"/>
        <ellipse cx="80" cy="105" rx="30" ry="18" fill="#FFDAB9"/>
        {/* 头 */}
        <circle cx="80" cy="45" r="30" fill="#D2691E"/>
        {/* 脸部白色 */}
        <ellipse cx="80" cy="50" rx="18" ry="16" fill="#FFDAB9"/>
        {/* 三角耳朵 */}
        <path d="M50 28 L42 8 L62 22 Z" fill="#D2691E"/>
        <path d="M110 28 L118 8 L98 22 Z" fill="#D2691E"/>
        <path d="M53 26 L47 12 L60 23 Z" fill="#FFE4E6"/>
        <path d="M107 26 L113 12 L100 23 Z" fill="#FFE4E6"/>
        {/* 眼睛 */}
        <circle cx="68" cy="42" r="4.5" fill="#2d2d2d"/>
        <circle cx="92" cy="42" r="4.5" fill="#2d2d2d"/>
        <circle cx="70" cy="40" r="1.5" fill="white"/>
        <circle cx="94" cy="40" r="1.5" fill="white"/>
        {/* 鼻子 */}
        <ellipse cx="80" cy="52" rx="5" ry="3.5" fill="#1a1a1a"/>
        {/* 嘴巴 - 柴犬微笑 */}
        <path d="M72 56 Q80 62 88 56" stroke="#2d2d2d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M80 52 L80 56" stroke="#2d2d2d" strokeWidth="1"/>
        {/* 腮红 */}
        <ellipse cx="58" cy="50" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        <ellipse cx="102" cy="50" rx="5" ry="3" fill="#FFB6C1" opacity="0.5"/>
        {/* 腿 */}
        <rect x="52" y="122" width="10" height="14" rx="5" fill="#D2691E"/>
        <rect x="98" y="122" width="10" height="14" rx="5" fill="#D2691E"/>
        {/* 卷尾巴 */}
        <path d="M120 80 Q135 65 130 85 Q140 70 135 95" stroke="#D2691E" strokeWidth="8" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// 获取随机动物
export const getRandomAnimal = () => {
  return animals[Math.floor(Math.random() * animals.length)];
};

// 可爱动物组件
interface CuteAnimalProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const CuteAnimal: React.FC<CuteAnimalProps> = ({ size = 160, className, style }) => {
  const animal = React.useMemo(() => getRandomAnimal(), []);
  
  return (
    <div className={className} style={style}>
      <div style={{ width: size, height: size * 0.94 }}>
        {React.cloneElement(animal.svg as React.ReactElement, {
          width: '100%',
          height: '100%',
        })}
      </div>
      <p className="text-center text-xs text-primary-400 mt-1">{animal.name}</p>
    </div>
  );
};

export default animals;
