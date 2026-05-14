import { describe, expect, it } from 'vitest';
import { planRoads } from '../src/planning/roads';

describe('planRoads', () => {
  it('creates road construction sites from spawn to sources and controller', () => {
    const sitesCreated: Array<{ x: number; y: number; type: string }> = [];

    const room = {
      name: 'W1N1',
      find: (type: number) => {
        if (type === FIND_MY_SPAWNS) return [{ pos: { x: 25, y: 25 } }];
        if (type === FIND_SOURCES) return [{ pos: { x: 10, y: 10 } }];
        return [];
      },
      findPath: (start: unknown, end: unknown, opts: unknown) => [
        { x: 20, y: 20 },
        { x: 15, y: 15 },
      ],
      controller: { pos: { x: 40, y: 40 } },
      createConstructionSite: (pos: any, type: string) => {
        sitesCreated.push({ x: pos.x, y: pos.y, type });
        return 0; // OK
      },
    } as unknown as Room;

    globalThis.RoomPosition = class RoomPosition {
      x: number;
      y: number;
      roomName: string;
      constructor(x: number, y: number, roomName: string) {
        this.x = x;
        this.y = y;
        this.roomName = roomName;
      }
    } as any;

    globalThis.FIND_MY_SPAWNS = 111;
    globalThis.FIND_SOURCES = 105;
    globalThis.STRUCTURE_ROAD = 'road';

    planRoads(room);

    expect(sitesCreated).toHaveLength(4); // 2 steps for source + 2 steps for controller
    expect(sitesCreated[0]).toEqual({ x: 20, y: 20, type: 'road' });
    expect(sitesCreated[2]).toEqual({ x: 20, y: 20, type: 'road' });
  });
});
