const CURRENT_ROOM_MEMORY_VERSION = 1;

interface VersionedRoomMemory {
  version?: number;
  sources?: unknown;
}

export function cleanupDeadCreepMemory(): string[] {
  const removed: string[] = [];

  for (const name of Object.keys(Memory.creeps)) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      removed.push(name);
    }
  }

  return removed;
}

export function migrateRoomMemory(roomName: string): void {
  Memory.rooms ??= {};

  const roomMemory = (Memory.rooms[roomName] ??= {}) as VersionedRoomMemory;

  if (roomMemory.version === CURRENT_ROOM_MEMORY_VERSION) {
    return;
  }

  if (!Array.isArray(roomMemory.sources)) {
    delete roomMemory.sources;
  }

  roomMemory.version = CURRENT_ROOM_MEMORY_VERSION;
}

export function migrateAllRoomMemory(): void {
  for (const spawn of Object.values(Game.spawns)) {
    if (spawn.room.name) {
      migrateRoomMemory(spawn.room.name);
    }
  }

  for (const roomName of Object.keys(Memory.rooms ?? {})) {
    migrateRoomMemory(roomName);
  }
}

export function maintainMemory(): void {
  cleanupDeadCreepMemory();
  migrateAllRoomMemory();
}
