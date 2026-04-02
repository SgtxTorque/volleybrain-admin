// ============================================
// FORMATION PHASE POSITIONS
// For each formation, rotation, and phase, define where players should be
//
// Positions use a grid coordinate system:
//   front-left (P4 area), front-center (P3 area), front-right (P2 area)
//   back-left (P5 area), back-center (P6 area), back-right (P1 area)
//
// Roles: S=Setter, OH=Outside Hitter, OH2=2nd Outside, MB=Middle Blocker,
//        MB2=2nd Middle, OPP=Opposite/Right Side, L=Libero
//
// In standard volleyball notation:
//   Rotation 1: S is at P1 (right back, serving position)
//   Rotation 2: S is at P6 (center back)
//   Rotation 3: S is at P5 (left back)
//   Rotation 4: S is at P4 (left front)
//   Rotation 5: S is at P3 (center front)
//   Rotation 6: S is at P2 (right front)
// ============================================

export const FORMATION_PHASES = {
  '5-1': {
    // ========================================
    // 5-1 SERVE RECEIVE
    // Libero replaces back-row MB. 3 passers (OH, OH2, L) form W-receive.
    // Non-passers tuck to net or sideline to stay legal and out of passing lanes.
    // ========================================
    serve_receive: {
      1: {
        label: 'Rotation 1',
        description: 'S at P1. Front: MB2 tucks left, OPP tucks center, OH front-right. Back: OH2 left-deep, L center-deep, S right-back.',
        slots: [
          { role: 'MB2', position: 'front-left', label: 'M2' },
          { role: 'OPP', position: 'front-center', label: 'RS' },
          { role: 'OH', position: 'front-right', label: 'OH' },
          { role: 'OH2', position: 'back-left', label: 'OH2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'S', position: 'back-right', label: 'S' },
        ],
      },
      2: {
        label: 'Rotation 2',
        description: 'S at P6. Front: OPP left, OH center, MB front-right. Back: L left-deep, S center-back, OH2 right-deep.',
        slots: [
          { role: 'OPP', position: 'front-left', label: 'RS' },
          { role: 'OH', position: 'front-center', label: 'OH' },
          { role: 'MB', position: 'front-right', label: 'M1' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'S', position: 'back-center', label: 'S' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      3: {
        label: 'Rotation 3',
        description: 'S at P5. Front: OH center-left, MB center, MB2 right. Back: S left-back, L center-deep, OH2 right-deep.',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'MB2', position: 'front-right', label: 'M2' },
          { role: 'S', position: 'back-left', label: 'S' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      4: {
        label: 'Rotation 4',
        description: 'S at P4. Front: S left-front, MB center, OPP right. Back: OH left-deep, L center-deep, OH2 right-deep.',
        slots: [
          { role: 'S', position: 'front-left', label: 'S' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'OPP', position: 'front-right', label: 'RS' },
          { role: 'OH', position: 'back-left', label: 'OH' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      5: {
        label: 'Rotation 5',
        description: 'S at P3. Front: MB2 left, S center, OPP right. Back: OH left-deep, L center-deep, OH2 right-deep.',
        slots: [
          { role: 'MB2', position: 'front-left', label: 'M2' },
          { role: 'S', position: 'front-center', label: 'S' },
          { role: 'OPP', position: 'front-right', label: 'RS' },
          { role: 'OH', position: 'back-left', label: 'OH' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      6: {
        label: 'Rotation 6',
        description: 'S at P2. Front: MB2 left, OPP center, S right. Back: OH left-deep, L center-deep, OH2 right-deep.',
        slots: [
          { role: 'MB2', position: 'front-left', label: 'M2' },
          { role: 'OPP', position: 'front-center', label: 'RS' },
          { role: 'S', position: 'front-right', label: 'S' },
          { role: 'OH', position: 'back-left', label: 'OH' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
    },

    // ========================================
    // 5-1 OFFENSE (TRANSITION / ATTACK)
    // After serve receive, players transition to attack positions.
    // Setter targets zone 2.5 (right-center front).
    // OH attacks from zone 4 (left), OPP from zone 2 (right), MB quick from zone 3 (center).
    // ========================================
    offense: {
      1: {
        label: 'Rotation 1',
        description: 'S penetrates from P1 to front-right target. OH hits left, OPP hits right, MB quick center.',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'MB2', position: 'front-center', label: 'M2' },
          { role: 'S', position: 'front-right', label: 'S' },
          { role: 'OH2', position: 'back-left', label: 'OH2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OPP', position: 'back-right', label: 'RS' },
        ],
      },
      2: {
        label: 'Rotation 2',
        description: 'S penetrates from P6 to front-right. OH4, MB quick, OPP right.',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'S', position: 'front-right', label: 'S' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'OPP', position: 'back-center', label: 'RS' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      3: {
        label: 'Rotation 3',
        description: 'S penetrates from P5 to front-right. OH4, MB quick, OPP right.',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'S', position: 'front-right', label: 'S' },
          { role: 'OH2', position: 'back-left', label: 'OH2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'MB2', position: 'back-right', label: 'M2' },
        ],
      },
      4: {
        label: 'Rotation 4',
        description: 'S is front-row at P4. Setter at right-front target. OH4, MB quick, OPP right.',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'S', position: 'front-right', label: 'S' },
          { role: 'OPP', position: 'back-left', label: 'RS' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      5: {
        label: 'Rotation 5',
        description: 'S is front-row at P3. Setter slides right to target. OH4, MB2 quick, OPP right.',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'MB2', position: 'front-center', label: 'M2' },
          { role: 'S', position: 'front-right', label: 'S' },
          { role: 'OPP', position: 'back-left', label: 'RS' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      6: {
        label: 'Rotation 6',
        description: 'S is front-row at P2, already at target. OH4, MB2 quick, OPP pipe from back.',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'MB2', position: 'front-center', label: 'M2' },
          { role: 'S', position: 'front-right', label: 'S' },
          { role: 'OPP', position: 'back-left', label: 'RS' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
    },

    // ========================================
    // 5-1 DEFENSE (BASE DEFENSE / PERIMETER)
    // Standard base-6 defense. Front-row blockers at net,
    // back-row defenders in deep court. Libero covers center-back.
    // ========================================
    defense: {
      1: {
        label: 'Rotation 1',
        description: 'Front-row: MB2 left block, OPP center block, OH right block. Back: OH2 left-deep, L center-deep, S right-back.',
        slots: [
          { role: 'MB2', position: 'front-left', label: 'M2' },
          { role: 'OPP', position: 'front-center', label: 'RS' },
          { role: 'OH', position: 'front-right', label: 'OH' },
          { role: 'OH2', position: 'back-left', label: 'OH2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'S', position: 'back-right', label: 'S' },
        ],
      },
      2: {
        label: 'Rotation 2',
        description: 'Front-row: OPP left block, OH center block, MB right block. Back: L left-deep, S center-back, OH2 right-deep.',
        slots: [
          { role: 'OPP', position: 'front-left', label: 'RS' },
          { role: 'OH', position: 'front-center', label: 'OH' },
          { role: 'MB', position: 'front-right', label: 'M1' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'S', position: 'back-center', label: 'S' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      3: {
        label: 'Rotation 3',
        description: 'Front-row: OH left, MB center, MB2 right. Back: S left-back, L center-deep, OH2 right-deep.',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'MB2', position: 'front-right', label: 'M2' },
          { role: 'S', position: 'back-left', label: 'S' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      4: {
        label: 'Rotation 4',
        description: 'Front-row: S left, MB center, OPP right. Back: OH left-deep, L center-deep, OH2 right-deep.',
        slots: [
          { role: 'S', position: 'front-left', label: 'S' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'OPP', position: 'front-right', label: 'RS' },
          { role: 'OH', position: 'back-left', label: 'OH' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      5: {
        label: 'Rotation 5',
        description: 'Front-row: MB2 left, S center, OPP right. Back: OH left-deep, L center-deep, OH2 right-deep.',
        slots: [
          { role: 'MB2', position: 'front-left', label: 'M2' },
          { role: 'S', position: 'front-center', label: 'S' },
          { role: 'OPP', position: 'front-right', label: 'RS' },
          { role: 'OH', position: 'back-left', label: 'OH' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      6: {
        label: 'Rotation 6',
        description: 'Front-row: MB2 left, OPP center, S right. Back: OH left-deep, L center-deep, OH2 right-deep.',
        slots: [
          { role: 'MB2', position: 'front-left', label: 'M2' },
          { role: 'OPP', position: 'front-center', label: 'RS' },
          { role: 'S', position: 'front-right', label: 'S' },
          { role: 'OH', position: 'back-left', label: 'OH' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
    },
  },

  '6-2': {
    // ========================================
    // 6-2 SERVE RECEIVE
    // Two setters. The back-row setter sets, front-row setter hits.
    // This gives 3 front-row attackers at all times.
    // S1 and S2 alternate: when one is front-row, the other sets from back.
    // ========================================
    serve_receive: {
      1: {
        label: 'Rotation 1',
        slots: [
          { role: 'MB', position: 'front-left', label: 'M1' },
          { role: 'OH', position: 'front-center', label: 'OH' },
          { role: 'S1', position: 'front-right', label: 'S1' },
          { role: 'OH2', position: 'back-left', label: 'OH2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'S2', position: 'back-right', label: 'S2' },
        ],
      },
      2: {
        label: 'Rotation 2',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'S1', position: 'front-center', label: 'S1' },
          { role: 'MB2', position: 'front-right', label: 'M2' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'S2', position: 'back-center', label: 'S2' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      3: {
        label: 'Rotation 3',
        slots: [
          { role: 'S1', position: 'front-left', label: 'S1' },
          { role: 'MB2', position: 'front-center', label: 'M2' },
          { role: 'OH2', position: 'front-right', label: 'OH2' },
          { role: 'S2', position: 'back-left', label: 'S2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'MB', position: 'back-right', label: 'M1' },
        ],
      },
      4: {
        label: 'Rotation 4',
        slots: [
          { role: 'MB2', position: 'front-left', label: 'M2' },
          { role: 'OH2', position: 'front-center', label: 'OH2' },
          { role: 'S2', position: 'front-right', label: 'S2' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'MB', position: 'back-center', label: 'M1' },
          { role: 'S1', position: 'back-right', label: 'S1' },
        ],
      },
      5: {
        label: 'Rotation 5',
        slots: [
          { role: 'OH2', position: 'front-left', label: 'OH2' },
          { role: 'S2', position: 'front-center', label: 'S2' },
          { role: 'MB', position: 'front-right', label: 'M1' },
          { role: 'MB2', position: 'back-left', label: 'M2' },
          { role: 'S1', position: 'back-center', label: 'S1' },
          { role: 'L', position: 'back-right', label: 'L' },
        ],
      },
      6: {
        label: 'Rotation 6',
        slots: [
          { role: 'S2', position: 'front-left', label: 'S2' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'OH', position: 'front-right', label: 'OH' },
          { role: 'S1', position: 'back-left', label: 'S1' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'MB2', position: 'back-right', label: 'M2' },
        ],
      },
    },

    offense: {
      1: {
        label: 'Rotation 1',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'S1', position: 'front-right', label: 'S1' },
          { role: 'OH2', position: 'back-left', label: 'OH2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'S2', position: 'back-right', label: 'S2' },
        ],
      },
      2: {
        label: 'Rotation 2',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'S1', position: 'front-center', label: 'S1' },
          { role: 'MB2', position: 'front-right', label: 'M2' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'S2', position: 'back-center', label: 'S2' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      3: {
        label: 'Rotation 3',
        slots: [
          { role: 'S1', position: 'front-left', label: 'S1' },
          { role: 'MB2', position: 'front-center', label: 'M2' },
          { role: 'OH2', position: 'front-right', label: 'OH2' },
          { role: 'S2', position: 'back-left', label: 'S2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'MB', position: 'back-right', label: 'M1' },
        ],
      },
      4: {
        label: 'Rotation 4',
        slots: [
          { role: 'MB2', position: 'front-left', label: 'M2' },
          { role: 'OH2', position: 'front-center', label: 'OH2' },
          { role: 'S2', position: 'front-right', label: 'S2' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'MB', position: 'back-center', label: 'M1' },
          { role: 'S1', position: 'back-right', label: 'S1' },
        ],
      },
      5: {
        label: 'Rotation 5',
        slots: [
          { role: 'OH2', position: 'front-left', label: 'OH2' },
          { role: 'S2', position: 'front-center', label: 'S2' },
          { role: 'MB', position: 'front-right', label: 'M1' },
          { role: 'MB2', position: 'back-left', label: 'M2' },
          { role: 'S1', position: 'back-center', label: 'S1' },
          { role: 'L', position: 'back-right', label: 'L' },
        ],
      },
      6: {
        label: 'Rotation 6',
        slots: [
          { role: 'S2', position: 'front-left', label: 'S2' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'OH', position: 'front-right', label: 'OH' },
          { role: 'S1', position: 'back-left', label: 'S1' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'MB2', position: 'back-right', label: 'M2' },
        ],
      },
    },

    defense: {
      1: {
        label: 'Rotation 1',
        slots: [
          { role: 'MB', position: 'front-left', label: 'M1' },
          { role: 'OH', position: 'front-center', label: 'OH' },
          { role: 'S1', position: 'front-right', label: 'S1' },
          { role: 'OH2', position: 'back-left', label: 'OH2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'S2', position: 'back-right', label: 'S2' },
        ],
      },
      2: {
        label: 'Rotation 2',
        slots: [
          { role: 'OH', position: 'front-left', label: 'OH' },
          { role: 'S1', position: 'front-center', label: 'S1' },
          { role: 'MB2', position: 'front-right', label: 'M2' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'S2', position: 'back-center', label: 'S2' },
          { role: 'OH2', position: 'back-right', label: 'OH2' },
        ],
      },
      3: {
        label: 'Rotation 3',
        slots: [
          { role: 'S1', position: 'front-left', label: 'S1' },
          { role: 'MB2', position: 'front-center', label: 'M2' },
          { role: 'OH2', position: 'front-right', label: 'OH2' },
          { role: 'S2', position: 'back-left', label: 'S2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'MB', position: 'back-right', label: 'M1' },
        ],
      },
      4: {
        label: 'Rotation 4',
        slots: [
          { role: 'MB2', position: 'front-left', label: 'M2' },
          { role: 'OH2', position: 'front-center', label: 'OH2' },
          { role: 'S2', position: 'front-right', label: 'S2' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'MB', position: 'back-center', label: 'M1' },
          { role: 'S1', position: 'back-right', label: 'S1' },
        ],
      },
      5: {
        label: 'Rotation 5',
        slots: [
          { role: 'OH2', position: 'front-left', label: 'OH2' },
          { role: 'S2', position: 'front-center', label: 'S2' },
          { role: 'MB', position: 'front-right', label: 'M1' },
          { role: 'MB2', position: 'back-left', label: 'M2' },
          { role: 'S1', position: 'back-center', label: 'S1' },
          { role: 'L', position: 'back-right', label: 'L' },
        ],
      },
      6: {
        label: 'Rotation 6',
        slots: [
          { role: 'S2', position: 'front-left', label: 'S2' },
          { role: 'MB', position: 'front-center', label: 'M1' },
          { role: 'OH', position: 'front-right', label: 'OH' },
          { role: 'S1', position: 'back-left', label: 'S1' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'MB2', position: 'back-right', label: 'M2' },
        ],
      },
    },
  },
}

// Phase labels and colors for UI display
export const PHASE_CONFIG = {
  base: { label: 'Base / Home', color: '#64748B', icon: '🏠' },
  serve_receive: { label: 'Serve Receive', color: '#3B82F6', icon: '🏐' },
  offense: { label: 'Offense', color: '#EF4444', icon: '⚡' },
  defense: { label: 'Defense', color: '#10B981', icon: '🛡️' },
}

// Formations that support phase views (4-2, 6-6 are too simple)
export const PHASE_SUPPORTED_FORMATIONS = ['5-1', '6-2']

// Maps position string to grid coordinates for mini court rendering
// front-left=P4, front-center=P3, front-right=P2
// back-left=P5, back-center=P6, back-right=P1
export const POSITION_TO_GRID = {
  'front-left': { row: 0, col: 0 },   // P4 area
  'front-center': { row: 0, col: 1 }, // P3 area
  'front-right': { row: 0, col: 2 },  // P2 area
  'back-left': { row: 1, col: 0 },    // P5 area
  'back-center': { row: 1, col: 1 },  // P6 area
  'back-right': { row: 1, col: 2 },   // P1 area
}
