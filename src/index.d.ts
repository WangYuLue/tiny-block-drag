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

interface IOldHightLightData {
  $dom?: HTMLElement,
  type?: TInsertToBlockType
}

type TInsertToRoot = 'before' | 'next';

type TInsertToBlockType = 'before' | 'next' | 'inner';

interface IRenderTreeProps {
  dataTree: IBlock[];
  setDataTree: (data: IBlock[]) => void;
  deleteByID: (arr: IBlock[], id: string) => void;
}