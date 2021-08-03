interface IBlockMata {
  id: string;
  name: string;
  type: 'simple' | 'frame';
}

interface IBlock {
  id: string;
  name: string;
  children?: IBlock[];
  parent?: IBlock;
}

type TInsertToRoot = 'before' | 'next';

type TInsertToBlockType = 'before' | 'next' | 'inner';