const RCL2_EXTENSION_LIMIT = 5;
const ROOM_EDGE_MIN = 1;
const ROOM_EDGE_MAX = 48;

export interface ExtensionPlanPosition {
  x: number;
  y: number;
  roomName?: string;
}

export function planRcl2Extensions(room: Room): number {
  if (!room.controller || (room.controller.level ?? 1) < 2 || !room.createConstructionSite) return 0;

  const existingExtensions = room
    .find(FIND_STRUCTURES)
    .filter((structure) => structure.structureType === STRUCTURE_EXTENSION).length;
  const pendingExtensions = room
    .find(FIND_CONSTRUCTION_SITES)
    .filter((site) => site.structureType === STRUCTURE_EXTENSION).length;
  const availableSlots = RCL2_EXTENSION_LIMIT - existingExtensions - pendingExtensions;
  if (availableSlots <= 0) return 0;

  const positions = chooseExtensionConstructionPositions(room, availableSlots);
  let created = 0;
  for (const position of positions) {
    const result = room.createConstructionSite(position.x, position.y, STRUCTURE_EXTENSION);
    if (result === 0) created += 1;
  }

  return created;
}

export function chooseExtensionConstructionPositions(room: Room, limit = RCL2_EXTENSION_LIMIT): ExtensionPlanPosition[] {
  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (!spawn || limit <= 0) return [];

  const occupied = new Set<string>();
  for (const structure of room.find(FIND_STRUCTURES)) {
    addOccupiedPosition(occupied, structure.pos);
  }
  for (const site of room.find(FIND_CONSTRUCTION_SITES)) {
    addOccupiedPosition(occupied, site.pos);
  }

  const sourcePositions = room.find(FIND_SOURCES).map((source) => source.pos);
  const controllerPosition = room.controller?.pos;
  const candidates = buildCandidateRing(spawn.pos)
    .filter((position) => isInsideUsableRoom(position))
    .filter((position) => !occupied.has(positionKey(position)))
    .filter((position) => !isAdjacentToAny(position, sourcePositions))
    .filter((position) => !isOnPrimarySpawnExit(spawn.pos, position))
    .sort((a, b) => rangeTo(a, controllerPosition) - rangeTo(b, controllerPosition));

  return candidates.slice(0, limit);
}

function buildCandidateRing(spawnPos: RoomPosition): ExtensionPlanPosition[] {
  const x = spawnPos.x ?? 25;
  const y = spawnPos.y ?? 25;
  const roomName = spawnPos.roomName;
  const offsets = [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
    [-2, -1],
    [-2, 1],
    [2, -1],
    [2, 1],
    [-1, -2],
    [1, -2],
    [-1, 2],
    [1, 2],
    [-2, -2],
    [2, -2],
    [-2, 2],
    [2, 2],
    [-3, 0],
    [3, 0],
    [0, -3],
    [0, 3],
  ];

  return offsets.map(([dx, dy]) => ({ x: x + dx, y: y + dy, roomName }));
}

function addOccupiedPosition(occupied: Set<string>, pos: RoomPosition): void {
  if (typeof pos.x === 'number' && typeof pos.y === 'number') {
    occupied.add(positionKey(pos));
  }
}

function positionKey(pos: Pick<RoomPosition, 'x' | 'y'>): string {
  return `${pos.x},${pos.y}`;
}

function isInsideUsableRoom(pos: ExtensionPlanPosition): boolean {
  return pos.x >= ROOM_EDGE_MIN && pos.x <= ROOM_EDGE_MAX && pos.y >= ROOM_EDGE_MIN && pos.y <= ROOM_EDGE_MAX;
}

function isAdjacentToAny(pos: ExtensionPlanPosition, targets: RoomPosition[]): boolean {
  return targets.some((target) => rangeTo(pos, target) <= 1);
}

function isOnPrimarySpawnExit(spawnPos: RoomPosition, pos: ExtensionPlanPosition): boolean {
  const dx = Math.abs((spawnPos.x ?? 25) - pos.x);
  const dy = Math.abs((spawnPos.y ?? 25) - pos.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function rangeTo(pos: ExtensionPlanPosition, target?: RoomPosition): number {
  if (!target || typeof target.x !== 'number' || typeof target.y !== 'number') return 0;
  return Math.max(Math.abs(pos.x - target.x), Math.abs(pos.y - target.y));
}
