/// <reference path="index.d.ts"/>

import './index.scss';
import { v4 as uuidv4 } from 'uuid';

/**
 * 常量
 */
const CONST = {
  CHANNEL: {
    COPY: 'channel-copy',
    MOVE: 'channel-move'
  },
  CALSS: {
    BLOCK: 's-block',
    FRAME: 's-frame'
  }
}

/**
 * 控件列表元数据
 */
let blockMetaList: IBlockMata[] = [
  {
    name: 'block-meta-1',
    id: uuidv4(),
    type: 'simple'
  },
  {
    name: 'block-meta-2',
    id: uuidv4(),
    type: 'simple'
  },
  {
    name: 'block-meta-3',
    id: uuidv4(),
    type: 'simple'
  },
  {
    name: 'block-meta-frame-1',
    id: uuidv4(),
    type: 'frame'
  },
]

/**
 * 树数据
 */
let dataTree: IBlock[] = [
  {
    name: 'block-1',
    id: uuidv4()
  },
  {
    name: 'block-2',
    id: uuidv4()
  },
  {
    name: 'block-frame-20',
    id: uuidv4(),
    children: [
      {
        name: 'block-21',
        id: uuidv4()
      },
      {
        name: 'block-22',
        id: uuidv4()
      },
    ]
  },
  {
    name: 'block-frame-30',
    id: uuidv4(),
    children: [

    ]
  },
  {
    name: 'block-3',
    id: uuidv4()
  }
]

/**
 * 高亮 dom 数据集
 */
const oldHightLightData: {
  $dom?: HTMLElement,
  type?: TInsertToBlockType
} = {}

let currentDraggingId: string = null;

/**
 * 循环1000次，测试性能
 */
// for (let i = 0; i < 1000; i++) {
//   dataTree.push({
//     name: 'block-xxx',
//     id: uuidv4()
//   })
// }

/**
 * 根据 blockMeta 实例化 block
 * @param blockMeta 
 * @returns 
 */
function makeBlock(blockMeta: IBlockMata): IBlock {
  const block: IBlock = {
    name: blockMeta.name,
    id: uuidv4()
  }
  if (blockMeta.type === 'frame') {
    block.children = []
  }
  return block;
}


/**
 * 从列表中开始拖拽
 * @param ev 
 */
function onMetaDragStart(ev) {
  const blockMata = blockMetaList.find(blockMata => blockMata.id === ev.target.id)
  ev.dataTransfer.setData(CONST.CHANNEL.COPY, JSON.stringify(blockMata));
}


/**
 * 落到 container 上
 * @param ev 
 */
function onBlankDragOver(ev) {
  highLightRoot();
  ev.preventDefault();
}

/**
 * 落到 container 上
 * @param ev 
 */
function onBlankDrop(ev) {
  ev.preventDefault();
  try {
    const channelCopyStr = ev.dataTransfer.getData(CONST.CHANNEL.COPY);
    const channelMoveStr = ev.dataTransfer.getData(CONST.CHANNEL.MOVE);

    if (channelCopyStr) {
      const blockMata: IBlockMata = JSON.parse(channelCopyStr);
      insertToRoot(makeBlock(blockMata));
    } else if (channelMoveStr) {
      const blockId = channelMoveStr;
      const targetBlock = getByID(blockId);
      // 删除原来的控件
      deleteByID(dataTree, blockId);
      // 将控件移动到树的尾部
      insertToRoot(targetBlock);
    }
    render();
  } finally {
    clearHightLight();
    currentDraggingId = null;
  }
}

/**
 * 落到树上
 * @param ev 
 */
function onTreeDragOver(ev) {
  highLight(ev);
  ev.preventDefault();
  ev.stopPropagation();
}

/**
 * 从树中开始拖拽
 * @param ev 
 */
function onTreeDragStart(ev) {
  currentDraggingId = ev.target.id;
  ev.dataTransfer.setData(CONST.CHANNEL.MOVE, ev.target.id);
}

function highLightRoot() {
  const id = dataTree[dataTree.length - 1].id;
  const $dom = document.getElementById(id);
  if ($dom) {
    // 如果目标元素没有变化，则不执行后续操作
    if (
      oldHightLightData.$dom === $dom &&
      oldHightLightData.type === 'next'
    ) {
      return;
    }

    clearHightLight();

    oldHightLightData.$dom = $dom;
    oldHightLightData.type = 'next';

    $dom.style.borderBottom = '3px solid blue';
    $dom.style.marginBottom = '-2px';
  }
}

/**
 * 拖拽区域样式高亮
 * 
 * @param ev 
 */
function highLight(ev) {
  const [, type, $wrap] = findTargetDropDom(ev);

  let $dom = $wrap;
  if (type === 'before' || type == 'next') {
    $dom = $wrap.children[0] as HTMLElement;
  }

  // 如果目标元素没有变化，则不执行后续操作
  if (
    oldHightLightData.$dom === $dom &&
    oldHightLightData.type === type
  ) {
    return;
  }

  clearHightLight();

  oldHightLightData.$dom = $dom;
  oldHightLightData.type = type;

  if (type === 'inner') {
    $dom.style.background = '#40abff';
  } else if (type === 'before') {
    $dom.style.borderTop = '3px solid blue';
    $dom.style.marginTop = '-2px';
  } else if (type === 'next') {
    $dom.style.borderBottom = '3px solid blue';
    $dom.style.marginBottom = '-2px';
  }
}

function clearHightLight() {
  // 清除老的高亮样式
  if (oldHightLightData.$dom) {
    oldHightLightData.$dom.style.background = '';
    oldHightLightData.$dom.style.borderTop = '';
    oldHightLightData.$dom.style.borderBottom = '';
    oldHightLightData.$dom.style.marginTop = '';
    oldHightLightData.$dom.style.marginBottom = '';
  }
}


/**
 * 落到树上
 * @param ev 
 */
function onTreeDrop(ev) {
  try {
    ev.preventDefault();
    ev.stopPropagation();
    const channelCopyStr = ev.dataTransfer.getData(CONST.CHANNEL.COPY);
    const channelMoveStr = ev.dataTransfer.getData(CONST.CHANNEL.MOVE);
    const [id, type] = findTargetDropDom(ev);

    if (channelCopyStr) {
      const blockMata: IBlockMata = JSON.parse(channelCopyStr);
      insertToBlock(getByID(id), makeBlock(blockMata), type)
    } else if (channelMoveStr) {
      const blockId = channelMoveStr;
      // 如果目标 ID 和 要移动的 ID 相同，则表示无需移动
      if (blockId !== id) {
        const _block = getByID(blockId);
        deleteByID(dataTree, blockId);
        insertToBlock(getByID(id), _block, type)
      }
    }
    render();
  } finally {
    clearHightLight();
    currentDraggingId = null;
  }
}

/**
 * 从 event 判断需要落到哪个drop区域
 * 
 * @param ev 
 * @returns [对应控件的ID，放入的类型， 目标Dom]
 */
function findTargetDropDom(ev): [string, TInsertToBlockType, HTMLElement] {
  let path: HTMLElement[] = ev.path;
  // 下面逻辑用于处理 当前block 落在自己 子block 的情况 
  // === start ===
  const $dragDom = document.getElementById(currentDraggingId);
  const index = path.findIndex(i => i === $dragDom) + 1;
  path = path.slice(index);
  // === end ===

  let type: TInsertToBlockType;
  for (let x = 0; x < path.length; x++) {
    if (path[x].classList !== undefined) {
      const classList = [...path[x].classList];
      for (let y = 0; y < classList.length; y++) {
        if (classList[y] === CONST.CALSS.FRAME) {
          type = 'inner'
        }
        if (classList[y] === CONST.CALSS.BLOCK) {
          const { y } = ev;
          const { height, top } = path[x].getBoundingClientRect();
          if (height > (y - top) * 2) {
            type = 'before'
          } else {
            type = 'next'
          }
        }
        if (type) {
          return [path[x].dataset.id, type, path[x]];
        }
      }
    }
  }
}


/**
 * 渲染容器控件树
 */
function render() {
  const $container = document.querySelector('#container');
  const _render = () => {
    const _genblock = (item, isLast) => {
      const { id, name, children } = item;
      let childrenStr = '';
      if (children) {
        childrenStr = `
          <div class="block-frame ${CONST.CALSS.FRAME}" data-id='${id}'>
            ${children.map((i, index) => _genblock(i, index === children.length - 1)).join('')}
          </div>
        `
      }
      return `
        <div class="block-wrap ${CONST.CALSS.BLOCK}"  data-id='${id}' ondrop="onTreeDrop(event)" ondragover="onTreeDragOver(event)">
          <div id='${id}' class="block" draggable="true" ondragstart="onTreeDragStart(event)">
            <div class="title">${name}</div>
            ${childrenStr}
          </div>
          ${isLast ? '' : '<div class="block-arrow"></div>'}
        </div>
      `
    }
    return dataTree.map((i, index) => _genblock(i, index === dataTree.length - 1)).join('')
  }
  // render 后去除对 highLightDome 的指针引用
  oldHightLightData.$dom = undefined;
  oldHightLightData.type = undefined;
  $container.innerHTML = _render();
}

/**
 * 渲染左侧控件列表
 */
function renderMeta() {
  const $blockMetaList = document.querySelector('#block-meta-list')
  const str = blockMetaList.map(blockMeta => {
    return ` <div draggable="true" id="${blockMeta.id}" class="block-meta" ondragstart="onMetaDragStart(event)">${blockMeta.name}</div>`
  }).join('')
  $blockMetaList.innerHTML = str;
}

/**
 * 控件添加到 根
 * @param block 
 */
function insertToRoot(block: IBlock, type: TInsertToRoot = 'next') {
  if (type === 'next') {
    dataTree.push(block);
  } else {
    dataTree.unshift(block);
  }
  link();
}

/**
 * 基于某个 block 为锚点添加 block
 * @param target 
 * @param block 
 * @param type 
 */
function insertToBlock(target: IBlock, block: IBlock, type: TInsertToBlockType = 'next') {
  if (!target) throw 'target is required; fn insertToBlock';
  if (!block) throw 'block is required; fn insertToBlock';
  if (type === 'next') {
    const list = target.parent?.children || dataTree;
    const index = list.findIndex(block => block.id === target.id);
    list.splice(index + 1, 0, block);
  } else if (type === 'before') {
    const list = target.parent?.children || dataTree;
    const index = list.findIndex(block => block.id === target.id);
    list.splice(index, 0, block);
  } else {
    if (target.children) {
      target.children.push(block);
    }
  }
  link();
}


/**
 * 根据 id 删除树中的 block
 * @param arr 
 * @param id 
 * @returns 
 */
function deleteByID(arr: IBlock[], id: string) {
  for (let x = arr.length - 1; x >= 0; x--) {
    const block = arr[x];
    if (id === block.id) {
      arr.splice(x, 1);
      return;
    }
    if (block.children) {
      deleteByID(block.children, id);
    }
  }
  link();
}

/**
 * 根据 id 获得树中的 block
 * @param id 
 * @returns 
 */
function getByID(id: string) {
  let target;
  const _getByID = (arr: IBlock[], id: string) => {
    arr.forEach(block => {
      if (block.id === id) {
        target = block;
        return;
      }
      if (block.children) {
        _getByID(block.children, id);
      }
    })
  }
  _getByID(dataTree, id);
  return target;
}

function link() {
  const _link = (data: IBlock[], parent?: IBlock) => {
    data.forEach(block => {
      block.parent = parent;
      if (block.children) {
        _link(block.children, block)
      }
    })
  }
  _link(dataTree);
}

function init() {
  link();
  renderMeta();
  render();
}

init();


(window as any).onMetaDragStart = onMetaDragStart;

(window as any).onBlankDrop = onBlankDrop;
(window as any).onBlankDragOver = onBlankDragOver;

(window as any).onTreeDragStart = onTreeDragStart;
(window as any).onTreeDragOver = onTreeDragOver;
(window as any).onTreeDrop = onTreeDrop;
