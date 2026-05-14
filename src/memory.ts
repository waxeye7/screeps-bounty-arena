export const ROOM_MEMORY_VERSION = 1;
const DEFAULT_CREEP_ROLE: CreepRole = 'harvester';
const VALID_CREEP_ROLES: readonly CreepRole[] = ['harvester', 'upgrader', 'builder', 'repairer', 'miner', 'hauler'];

export interface RoomMemoryV1 {
  version: typeof ROOM_MEMORY_VERSION;
}

/**
 * Minimal Memory shape expected by the bot:
 * - Memory.creeps is a creep-name keyed object with optional valid role/sourceId fields.
 * - Memory.rooms is a room-name keyed object with a current version field per visible room.
 */
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

export function normalizeGameCreepMemory(): void {
  const creepMemory = ensureCreepMemoryRecord();
  const liveCreeps = isRecord(Game.creeps) ? Game.creeps : {};

  for (const [name, creep] of Object.entries(liveCreeps)) {
    const currentMemory = isRecord(creep.memory) ? creep.memory : creepMemory[name];
    const normalizedMemory = normalizeCreepMemoryRecord(currentMemory);
    creepMemory[name] = normalizedMemory;
    creep.memory = normalizedMemory;
  }
}

export function normalizeCreepMemory(creep: Creep): CreepMemory {
  const creepMemory = ensureCreepMemoryRecord();
  const currentMemory = isRecord(creep.memory) ? creep.memory : creepMemory[creep.name];
  const normalizedMemory = normalizeCreepMemoryRecord(currentMemory);
  creep.memory = normalizedMemory;
  creepMemory[creep.name] = normalizedMemory;
  return normalizedMemory;
}

export function creepRole(creep: Creep): CreepRole {
  return normalizeCreepMemory(creep).role ?? DEFAULT_CREEP_ROLE;
}

function ensureCreepMemoryRecord(): Record<string, CreepMemory> {
  if (!isRecord(Memory.creeps)) {
    Memory.creeps = {};
  }

  return Memory.creeps;
}

function ensureRoomMemoryRecord(): Record<string, RoomMemory> {
  if (!isRecord(Memory.rooms)) {
    Memory.rooms = {};
  }

  return Memory.rooms;
}

function normalizeCreepMemoryRecord(memory: unknown): CreepMemory {
  const record = isRecord(memory) ? memory : {};
  const normalized: CreepMemory = {
    role: isCreepRole(record.role) ? record.role : DEFAULT_CREEP_ROLE,
  };

  if (typeof record.sourceId === 'string') {
    normalized.sourceId = record.sourceId;
  }

  return normalized;
}

function isCreepRole(value: unknown): value is CreepRole {
  return typeof value === 'string' && VALID_CREEP_ROLES.includes(value as CreepRole);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateRoomMemory(): void {
  const roomsMemory = ensureRoomMemoryRecord();

  for (const roomName of Object.keys(Game.rooms ?? {})) {
    roomsMemory[roomName] = migrateRoomMemoryRecord(roomsMemory[roomName]);
  }
}

export function migrateRoomMemoryRecord(memory: unknown): RoomMemoryV1 {
  const record = isRecord(memory) ? memory : {};

  return {
    ...record,
    version: ROOM_MEMORY_VERSION,
  };
}
