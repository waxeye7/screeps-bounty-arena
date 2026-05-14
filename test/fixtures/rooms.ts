export interface MockRoomFixture {
  room: Room;
  spawn: StructureSpawn;
  createCalls: Array<{ x: number; y: number; structureType: string }>;
  spawnCalls: Array<{ body: BodyPartConstant[]; name: string; opts?: { memory?: CreepMemory } }>;
}

export interface MockRoomOptions {
  name?: string;
  controller?: StructureController;
  energyAvailable?: number;
  energyCapacityAvailable?: number;
  sources?: Source[];
  structures?: Structure[];
  constructionSites?: ConstructionSite[];
  droppedResources?: Resource<ResourceConstant>[];
}

export interface MockCreepOptions {
  name: string;
  role: CreepRole;
  room: Room;
  energyUsed?: number;
  freeCapacity?: number;
  calls?: string[];
}

export function mockPos(x?: number, y?: number, roomName = 'W1N1'): RoomPosition {
  return {
    x,
    y,
    roomName,
    isNearTo: (target: RoomObject) => {
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(target.pos.x) || !Number.isFinite(target.pos.y)) {
        return false;
      }

      return Math.max(Math.abs((x ?? 0) - (target.pos.x ?? 0)), Math.abs((y ?? 0) - (target.pos.y ?? 0))) <= 1;
    },
  };
}

export function mockSource(id = 'source1', x = 20, y = 20): Source {
  return { id, pos: mockPos(x, y) } as Source;
}

export function mockStructure(id: string, structureType: string, x: number, y: number): Structure {
  return { id, structureType, pos: mockPos(x, y), hits: 1000, hitsMax: 1000 } as Structure;
}

export function mockConstructionSite(id: string, structureType = STRUCTURE_ROAD, x = 21, y = 20): ConstructionSite {
  return { id, structureType, my: true, pos: mockPos(x, y) } as ConstructionSite;
}

export function noControllerRoomFixture(options: Omit<MockRoomOptions, 'controller'> = {}): MockRoomFixture {
  return mockRoomFixture({ ...options, controller: undefined });
}

export function mockRoomFixture(options: MockRoomOptions = {}): MockRoomFixture {
  const name = options.name ?? 'W1N1';
  const controller = Object.hasOwn(options, 'controller')
    ? options.controller
    : ({ id: 'controller1', level: 2, pos: mockPos(25, 20, name) } as StructureController);
  const energyAvailable = options.energyAvailable ?? 300;
  const energyCapacityAvailable = options.energyCapacityAvailable ?? 300;
  const sources = options.sources ?? [mockSource()];
  const structures = options.structures ?? [];
  const constructionSites = options.constructionSites ?? [];
  const droppedResources = options.droppedResources ?? [];
  const createCalls: MockRoomFixture['createCalls'] = [];
  const spawnCalls: MockRoomFixture['spawnCalls'] = [];
  const spawn = {
    id: 'spawn1',
    name: 'Spawn1',
    pos: mockPos(10, 10, name),
    room: undefined,
    spawning: null,
    store: { getFreeCapacity: () => energyCapacityAvailable, getUsedCapacity: () => 0 },
    structureType: STRUCTURE_SPAWN,
    hits: 5000,
    hitsMax: 5000,
    spawnCreep: (body: BodyPartConstant[], creepName: string, opts?: { memory?: CreepMemory }) => {
      spawnCalls.push({ body, name: creepName, opts });
      return 0;
    },
  } as unknown as StructureSpawn;

  const room = {
    name,
    controller,
    energyAvailable,
    energyCapacityAvailable,
    find: (type: number) => {
      switch (type) {
        case FIND_SOURCES:
          return sources;
        case FIND_MY_SPAWNS:
          return [spawn];
        case FIND_STRUCTURES:
        case FIND_MY_STRUCTURES:
          return [spawn, ...structures];
        case FIND_CONSTRUCTION_SITES:
          return constructionSites;
        case FIND_DROPPED_RESOURCES:
          return droppedResources;
        default:
          return [];
      }
    },
    createConstructionSite: (x: number, y: number, structureType: string) => {
      createCalls.push({ x, y, structureType });
      return 0;
    },
  } as unknown as Room;

  spawn.room = room;
  return { room, spawn, createCalls, spawnCalls };
}

export function mockCreep({ name, role, room, energyUsed = 0, freeCapacity = 50, calls = [] }: MockCreepOptions): Creep {
  return {
    id: name,
    name,
    memory: { role },
    room,
    pos: mockPos(12, 12, room.name),
    hits: 100,
    hitsMax: 100,
    store: {
      getFreeCapacity: () => freeCapacity,
      getUsedCapacity: (resource?: ResourceConstant) => (resource === undefined || resource === RESOURCE_ENERGY ? energyUsed : 0),
    },
    harvest: () => {
      calls.push(`${name}:harvest`);
      return 0;
    },
    transfer: () => {
      calls.push(`${name}:transfer`);
      return 0;
    },
    withdraw: () => {
      calls.push(`${name}:withdraw`);
      return 0;
    },
    pickup: () => {
      calls.push(`${name}:pickup`);
      return 0;
    },
    build: () => {
      calls.push(`${name}:build`);
      return 0;
    },
    repair: () => {
      calls.push(`${name}:repair`);
      return 0;
    },
    upgradeController: () => {
      calls.push(`${name}:upgrade`);
      return 0;
    },
    moveTo: () => {
      calls.push(`${name}:move`);
      return 0;
    },
    say: (message: string) => {
      calls.push(`${name}:say:${message}`);
      return 0;
    },
  } as unknown as Creep;
}
