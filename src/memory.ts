export const ROOM_MEMORY_VERSION = 1;

export interface RoomMemoryV1 {
  version: typeof ROOM_MEMORY_VERSION;
}

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

  return Memory.creeps;
}

function isRecord(value: unknown): value is Record<string, never> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The minimal expected shape for Memory is:
 * {
 *   creeps: Record<string, CreepMemory>,
 *   rooms: Record<string, RoomMemory>
 * }
 * 
 * CreepMemory: { role?: string, sourceId?: string }
 * RoomMemory: { version?: number }
 */

export function migrateRoomMemory(): void {
  if (!isRecord(Memory.rooms)) {
    Memory.rooms = {};
  }

  for (const roomName of Object.keys(Game.rooms ?? {})) {
    const rawExisting = Memory.rooms[roomName];
    const existing = isRecord(rawExisting) ? rawExisting : {};
    Memory.rooms[roomName] = migrateRoomMemoryRecord(existing);
  }
}

export function migrateRoomMemoryRecord(memory: Partial<RoomMemory>): RoomMemoryV1 {
  return {
    ...memory,
    version: ROOM_MEMORY_VERSION,
  };
}
