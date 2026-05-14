export const ROOM_MEMORY_VERSION = 1;

export interface RoomMemoryV1 {
  version: typeof ROOM_MEMORY_VERSION;
}

export function cleanupDeadCreeps(): string[] {
  const removed: string[] = [];

  for (const name of Object.keys(Memory.creeps)) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      removed.push(name);
    }
  }

  return removed;
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
