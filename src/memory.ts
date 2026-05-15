export const ROOM_MEMORY_VERSION = 1;

export interface RoomMemoryV1 {
  version: typeof ROOM_MEMORY_VERSION;
}

const VALID_CREEP_ROLES = new Set<CreepRole>([
  'builder',
  'harvester',
  'hauler',
  'miner',
  'repairer',
  'upgrader',
]);

// Minimal expected Memory shape: Memory.creeps and Memory.rooms are records.
// Creep memory may contain a known role and sourceId; invalid stale values are removed.
// Room memory is migrated to the current schema version each tick.

export function cleanupDeadCreeps(): string[] {
  const removed: string[] = [];
  const creepMemory = ensureCreepMemoryRecord();
  const liveCreeps = isRecord(Game.creeps) ? Game.creeps : {};

  for (const name of Object.keys(creepMemory)) {
    if (!liveCreeps[name]) {
      delete creepMemory[name];
      removed.push(name);
    }
  }

  return removed;
}

function ensureCreepMemoryRecord(): Record<string, CreepMemory> {
  if (!isRecord(Memory.creeps)) {
    Memory.creeps = {};
  }

  for (const [name, memory] of Object.entries(Memory.creeps)) {
    if (!isRecord(memory)) {
      delete Memory.creeps[name];
      continue;
    }

    if (memory.role !== undefined && !VALID_CREEP_ROLES.has(memory.role)) {
      delete memory.role;
    }
  }

  return Memory.creeps;
}

function isRecord(value: unknown): value is Record<string, never> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateRoomMemory(): void {
  Memory.rooms ??= {};

  for (const roomName of Object.keys(Game.rooms ?? {})) {
    const existing = Memory.rooms[roomName] ?? {};
    Memory.rooms[roomName] = migrateRoomMemoryRecord(existing);
  }
}

export function migrateRoomMemoryRecord(memory: Partial<RoomMemory>): RoomMemoryV1 {
  return {
    ...memory,
    version: ROOM_MEMORY_VERSION,
  };
}
