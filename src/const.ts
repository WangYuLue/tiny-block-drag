import { v4 as uuidV4 } from "uuid";

/**
 * 常量
 */
const CONST = {
  CHANNEL: {
    COPY: "channel-copy",
    MOVE: "channel-move",
  },
  CLASS: {
    BLOCK: "s-block",
    FRAME: "s-frame",
  },
};

/**
 * 控件列表元数据
 */
const blockMetaList: IBlockMeta[] = [
  {
    name: "block-meta-1",
    id: uuidV4(),
    type: "simple",
  },
  {
    name: "block-meta-2",
    id: uuidV4(),
    type: "simple",
  },
  {
    name: "block-meta-3",
    id: uuidV4(),
    type: "simple",
  },
  {
    name: "block-meta-frame-1",
    id: uuidV4(),
    type: "frame",
  },
];

const MockDataTree = [
  {
    name: "block-1",
    id: uuidV4(),
  },
  {
    name: "block-2",
    id: uuidV4(),
  },
  {
    name: "block-frame-20",
    id: uuidV4(),
    children: [
      {
        name: "block-21",
        id: uuidV4(),
      },
      {
        name: "block-22",
        id: uuidV4(),
      },
    ],
  },
  {
    name: "block-frame-30",
    id: uuidV4(),
    children: [],
  },
  {
    name: "block-3",
    id: uuidV4(),
  },
];

/**
 * 循环1000次，测试性能
 */
// for (let i = 0; i < 1000; i++) {
//   MockDataTree.push({
//     name: 'block-xxx',
//     id: uuidV4()
//   })
// }

export { CONST, blockMetaList, MockDataTree };
