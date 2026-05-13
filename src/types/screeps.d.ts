declare global {
  var Game: GameGlobal;
  var Memory: MemoryGlobal;
  var WORK: BodyPartConstant;
  var CARRY: BodyPartConstant;
  var MOVE: BodyPartConstant;
  var ERR_NOT_IN_RANGE: -9;
  var FIND_SOURCES: 105;
  var FIND_MY_SPAWNS: 100;
  var STRUCTURE_SPAWN: 'spawn';
  var RESOURCE_ENERGY: 'energy';

  type BodyPartConstant = 'work' | 'carry' | 'move';
  type ResourceConstant = 'energy';
  type CreepRole = 'harvester' | 'upgrader' | 'builder';

  interface MemoryGlobal {
    creeps: Record<string, CreepMemory>;
  }

  interface CreepMemory {
    role?: CreepRole;
    sourceId?: string;
  }

  interface GameGlobal {
    creeps: Record<string, Creep>;
    spawns: Record<string, StructureSpawn>;
    time: number;
  }

  interface RoomObject {
    id: string;
    pos: RoomPosition;
  }

  interface RoomPosition {
    isNearTo(target: RoomObject): boolean;
  }

  interface Source extends RoomObject {}

  interface Store {
    getFreeCapacity(resource?: ResourceConstant): number;
  }

  interface Creep extends RoomObject {
    name: string;
    memory: CreepMemory;
    store: Store;
    harvest(source: Source): 0 | -9;
    transfer(target: StructureSpawn, resource: ResourceConstant): 0 | -9;
    moveTo(target: RoomObject, opts?: { visualizePathStyle?: { stroke?: string } }): number;
    say(message: string): number;
  }

  interface Room {
    energyAvailable?: number;
    energyCapacityAvailable?: number;
    find(type: typeof FIND_SOURCES): Source[];
    find(type: typeof FIND_MY_SPAWNS): StructureSpawn[];
  }

  interface StructureSpawn extends RoomObject {
    structureType: typeof STRUCTURE_SPAWN;
    name: string;
    room: Room;
    spawning: unknown;
    spawnCreep(body: BodyPartConstant[], name: string, opts?: { memory?: CreepMemory }): number;
  }
}

export {};
