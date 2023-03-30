import { v4 as uuidV4 } from "uuid";
import { CONST } from "./const";

function link(dataTree: IBlock[]) {
  const _link = (data: IBlock[], parent?: IBlock) => {
    data.forEach((block) => {
      block.parent = parent;
      if (block.children) {
        _link(block.children, block);
      }
    });
  };
  _link(dataTree);
}

/**
 * 根据 blockMeta 实例化 block
 * @param blockMeta
 * @returns
 */
function makeBlock(blockMeta: IBlockMeta): IBlock {
  const block: IBlock = {
    name: blockMeta.name,
    id: uuidV4(),
  };
  if (blockMeta.type === "frame") {
    block.children = [];
  }
  return block;
}

/**
 * 根据 id 获得树中的 block
 * @param id
 * @returns
 */
function getByID(dataTree: IBlock[], id: string): IBlock | undefined {
  let target: IBlock | undefined;
  const _getByID = (arr: IBlock[], id: string) => {
    arr.forEach((block) => {
      if (block.id === id) {
        target = block;
        return;
      }
      if (block.children) {
        _getByID(block.children, id);
      }
    });
  };
  _getByID(dataTree, id);
  return target;
}

/**
 * 从 event 判断需要落到哪个drop区域
 *
 * @param ev
 * @returns [对应控件的ID，放入的类型， 目标Dom]
 */
function findTargetDropDom(
  ev,
  currentDraggingId: string
): [string, TInsertToBlockType, HTMLElement] {
  const getPath = (targetDom: HTMLElement): HTMLElement[] => {
    const res: HTMLElement[] = [];
    const _getPath = (targetDom: HTMLElement) => {
      if (targetDom) {
        res.push(targetDom);
        _getPath(targetDom.parentElement);
      }
    };
    _getPath(targetDom);
    return res;
  };

  let path: HTMLElement[] = getPath(ev.target);
  // 下面逻辑用于处理 当前block 落在自己 子block 的情况
  // === start ===
  const $dragDom = document.getElementById(currentDraggingId);
  const index = path.findIndex((i) => i === $dragDom) + 1;
  path = path.slice(index);
  // === end ===

  let type: TInsertToBlockType;
  for (let x = 0; x < path.length; x++) {
    if (path[x].classList !== undefined) {
      const classList = [...path[x].classList];

      for (let y = 0; y < classList.length; y++) {
        if (classList[y] === CONST.CLASS.FRAME) {
          type = "inner";
        }
        if (classList[y] === CONST.CLASS.BLOCK) {
          const { pageY } = ev;
          const { height, top } = path[x].getBoundingClientRect();
          if (height > (pageY - top) * 2) {
            type = "before";
          } else {
            type = "next";
          }
        }
        if (type) {
          return [path[x].dataset.id, type, path[x]];
        }
      }
    }
  }
}

function clearHightLight(oldHightLightData: IOldHightLightData) {
  // 清除老的高亮样式
  if (oldHightLightData.$dom) {
    oldHightLightData.$dom.style.background = "";
    oldHightLightData.$dom.style.borderTop = "";
    oldHightLightData.$dom.style.borderBottom = "";
    oldHightLightData.$dom.style.marginTop = "";
    oldHightLightData.$dom.style.marginBottom = "";
  }
}

export { link, makeBlock, getByID, findTargetDropDom, clearHightLight };
