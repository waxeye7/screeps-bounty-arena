const DEFAULT_MAX_NEW_ROAD_SITES = 5;
const ROOM_EDGE_MIN = 1;
const ROOM_EDGE_MAX = 48;

interface RoadPoint {
  x: number;
  y: number;
  roomName: string;
}

export interface RoadPlanSummary {
  targets: number;
  candidates: number;
  created: number;
  skippedExisting: number;
  skippedReserved: number;
}

export interface RoadPlanOptions {
  maxNewSites?: number;
}

export function planEarlyRoads(
  room: Room,
  options: RoadPlanOptions = {},
): RoadPlanSummary {
  const summary: RoadPlanSummary = {
    targets: 0,
    candidates: 0,
    created: 0,
    skippedExisting: 0,
    skippedReserved: 0,
  };

  if (!room.createConstructionSite) return summary;

  const spawn = chooseAnchorSpawn(room);
  if (!spawn || !hasCoordinates(spawn.pos)) return summary;

  const targets = roadTargets(room).filter((target) =>
    hasCoordinates(target.pos),
  );
  summary.targets = targets.length;

  const existing = occupiedRoadPlannerPositions(room);
  const planned = new Set<string>();
  const maxNewSites = Math.max(
    0,
    options.maxNewSites ?? DEFAULT_MAX_NEW_ROAD_SITES,
  );

  for (const target of targets) {
    const path = roadPath(spawn.pos, target.pos);
    for (const point of path) {
      if (summary.created >= maxNewSites) return summary;

      summary.candidates += 1;
      const key = positionKey(point);

      if (isReservedExtensionSlot(point, spawn.pos, target.pos)) {
        summary.skippedReserved += 1;
        continue;
      }

      if (existing.has(key) || planned.has(key)) {
        summary.skippedExisting += 1;
        continue;
      }

      const result = room.createConstructionSite(
        point.x,
        point.y,
        STRUCTURE_ROAD,
      );
      if (result === 0) {
        planned.add(key);
        existing.add(key);
        summary.created += 1;
      }
    }
  }

  return summary;
}

export function roadPath(start: RoomPosition, end: RoomPosition): RoadPoint[] {
  if (!hasCoordinates(start) || !hasCoordinates(end)) return [];

  const points: RoadPoint[] = [];
  let x = start.x;
  let y = start.y;
  const roomName = start.roomName ?? end.roomName ?? '';
  const exit = spawnExitDirection(start, end);

  for (let step = 0; step < 2 && !isNear({ x, y }, end); step += 1) {
    x += exit.dx;
    y += exit.dy;
    if (!isNear({ x, y }, end) && isBuildableRoadCoordinate(x, y)) {
      points.push({ x, y, roomName });
    }
  }

  while (!isNear({ x, y }, end)) {
    const dx = Math.sign(end.x - x);
    const dy = Math.sign(end.y - y);
    if (dx === 0 && dy === 0) break;

    x += dx;
    y += dy;

    if (!isNear({ x, y }, end) && isBuildableRoadCoordinate(x, y)) {
      points.push({ x, y, roomName });
    }
  }

  return points;
}

function chooseAnchorSpawn(room: Room): StructureSpawn | undefined {
  const roomSpawns = room.find(FIND_MY_SPAWNS);
  return (
    roomSpawns[0] ??
    Object.values(Game.spawns).find((spawn) => spawn.room === room)
  );
}

function roadTargets(room: Room): RoomObject[] {
  const targets: RoomObject[] = [...room.find(FIND_SOURCES)];
  if (room.controller) targets.push(room.controller);
  return targets;
}

function occupiedRoadPlannerPositions(room: Room): Set<string> {
  const occupied = new Set<string>();

  for (const structure of room.find(FIND_STRUCTURES)) {
    if (hasCoordinates(structure.pos)) occupied.add(positionKey(structure.pos));
  }

  for (const site of room.find(FIND_CONSTRUCTION_SITES)) {
    if (hasCoordinates(site.pos)) occupied.add(positionKey(site.pos));
  }

  for (const source of room.find(FIND_SOURCES)) {
    if (hasCoordinates(source.pos)) occupied.add(positionKey(source.pos));
  }

  if (room.controller && hasCoordinates(room.controller.pos)) {
    occupied.add(positionKey(room.controller.pos));
  }

  return occupied;
}

function isReservedExtensionSlot(
  point: RoadPoint,
  spawn: RoomPosition,
  target: RoomPosition,
): boolean {
  const rangeFromSpawn = range(point, spawn);
  if (rangeFromSpawn > 2) return false;

  const exit = spawnExitDirection(spawn, target);
  const spawnX = spawn.x ?? point.x;
  const spawnY = spawn.y ?? point.y;
  const sameCorridor =
    (exit.dx !== 0 &&
      point.y === spawnY &&
      Math.sign(point.x - spawnX) === exit.dx) ||
    (exit.dy !== 0 &&
      point.x === spawnX &&
      Math.sign(point.y - spawnY) === exit.dy);

  return !sameCorridor;
}

function spawnExitDirection(
  start: RoomPosition,
  end: RoomPosition,
): { dx: -1 | 0 | 1; dy: -1 | 0 | 1 } {
  const dx = Math.sign((end.x ?? 0) - (start.x ?? 0)) as -1 | 0 | 1;
  const dy = Math.sign((end.y ?? 0) - (start.y ?? 0)) as -1 | 0 | 1;
  const xDistance = Math.abs((end.x ?? 0) - (start.x ?? 0));
  const yDistance = Math.abs((end.y ?? 0) - (start.y ?? 0));

  if (xDistance >= yDistance && dx !== 0) return { dx, dy: 0 };
  if (dy !== 0) return { dx: 0, dy };
  return { dx, dy: 0 };
}

function isBuildableRoadCoordinate(x: number, y: number): boolean {
  return (
    x >= ROOM_EDGE_MIN &&
    x <= ROOM_EDGE_MAX &&
    y >= ROOM_EDGE_MIN &&
    y <= ROOM_EDGE_MAX
  );
}

function isNear(
  left: Pick<RoadPoint, 'x' | 'y'>,
  right: RoomPosition,
): boolean {
  return range(left, right) <= 1;
}

function range(left: Pick<RoadPoint, 'x' | 'y'>, right: RoomPosition): number {
  return Math.max(
    Math.abs(left.x - (right.x ?? left.x)),
    Math.abs(left.y - (right.y ?? left.y)),
  );
}

function hasCoordinates(
  pos: RoomPosition,
): pos is RoomPosition & { x: number; y: number } {
  return Number.isFinite(pos.x) && Number.isFinite(pos.y);
}

function positionKey(
  pos: Pick<RoadPoint, 'x' | 'y'> & { roomName?: string },
): string {
  return `${pos.roomName ?? ''}:${pos.x}:${pos.y}`;
}
