/// <reference path="index.d.ts"/>

import * as React from "react";
import * as ReactDom from "react-dom";
import { cloneDeep } from "lodash";

import { CONST, blockMetaList, MockDataTree } from "./const";
import {
  link,
  makeBlock,
  getByID,
  findTargetDropDom,
  clearHightLight,
} from "./util";

import "./index.scss";

const { useEffect, useState, Fragment } = React;

/**
 * 高亮 dom 数据集
 */
let oldHightLightData: IOldHightLightData = {};
const setOldHightLightData = (data: IOldHightLightData) => {
  oldHightLightData = data;
};

let currentDraggingId: string = null;
const setCurrentDraggingId = (id: string) => {
  currentDraggingId = id;
};

/**
 * 从列表中开始拖拽
 * @param ev
 */
function onMetaDragStart(ev) {
  const blockMeta = blockMetaList.find(
    (blockMeta) => blockMeta.id === ev.target.id
  );
  ev.dataTransfer.setData(CONST.CHANNEL.COPY, JSON.stringify(blockMeta));
}

/**
 * 渲染左侧控件列表
 */
function renderMeta() {
  const list = blockMetaList.map((blockMeta) => (
    <div
      draggable="true"
      key={blockMeta.id}
      id={blockMeta.id}
      className="block-meta"
      onDragStart={onMetaDragStart}
    >
      {blockMeta.name}
    </div>
  ));
  return <div id="block-meta-list">{list}</div>;
}

/**
 * 渲染工作区
 */
function renderContainer() {
  /**
   * 树数据
   */
  const [dataTree, setDataTree] = useState<IBlock[]>(MockDataTree);

  useEffect(() => {
    link(dataTree);
  }, []);

  /**
   * 落到 container 上
   * @param ev
   */
  const onBlankDragOver = (ev) => {
    highLightRoot();
    ev.preventDefault();
  };

  /**
   * 落到 container 上
   * @param ev
   */
  const onBlankDrop = (ev) => {
    try {
      ev.preventDefault();
      const channelCopyStr = ev.dataTransfer.getData(CONST.CHANNEL.COPY);
      const channelMoveStr = ev.dataTransfer.getData(CONST.CHANNEL.MOVE);

      if (channelCopyStr) {
        const blockMeta: IBlockMeta = JSON.parse(channelCopyStr);
        insertToRoot(makeBlock(blockMeta));
      } else if (channelMoveStr) {
        const blockId = channelMoveStr;
        const targetBlock = getByID(dataTree, blockId);
        // 删除原来的控件
        deleteByID(dataTree, blockId);
        // 将控件移动到树的尾部
        insertToRoot(targetBlock);
      }
    } finally {
      setCurrentDraggingId(null);
      clearHightLight(oldHightLightData);
    }
  };

  const highLightRoot = () => {
    const id = dataTree[dataTree.length - 1].id;
    const $dom = document.getElementById(id);
    if ($dom) {
      // 如果目标元素没有变化，则不执行后续操作
      if (
        oldHightLightData.$dom === $dom &&
        oldHightLightData.type === "next"
      ) {
        return;
      }

      clearHightLight(oldHightLightData);

      setOldHightLightData({ $dom, type: "next" });

      $dom.style.borderBottom = "3px solid blue";
      $dom.style.marginBottom = "-2px";
    }
  };

  /**
   * 控件添加到 根
   * @param block
   */
  const insertToRoot = (block: IBlock, type: TInsertToRoot = "next") => {
    if (type === "next") {
      setDataTree([...dataTree, block]);
    } else {
      setDataTree([block, ...dataTree]);
    }
  };

  /**
   * 根据 id 删除树中的 block
   * @param arr
   * @param id
   * @returns
   */
  const deleteByID = (blocks: IBlock[], id: string) => {
    const _deleteByID = (arr: IBlock[], id: string) => {
      for (let x = arr.length - 1; x >= 0; x--) {
        const block = arr[x];
        if (id === block.id) {
          arr.splice(x, 1);
          return;
        }
        if (block.children) {
          _deleteByID(block.children, id);
        }
      }
    };
    _deleteByID(blocks, id);
    setDataTree(cloneDeep(dataTree));
  };

  return (
    <div id="container" onDrop={onBlankDrop} onDragOver={onBlankDragOver}>
      <RenderTree
        dataTree={dataTree}
        setDataTree={setDataTree}
        deleteByID={deleteByID}
      />
    </div>
  );
}

/**
 * 渲染容器控件树
 */
function RenderTree(props: IRenderTreeProps) {
  const { dataTree, setDataTree, deleteByID } = props;

  link(dataTree);

  /**
   * 落到树上
   * @param ev
   */
  const onTreeDragOver = (ev) => {
    highLight(ev);
    ev.preventDefault();
    ev.stopPropagation();
  };

  /**
   * 从树中开始拖拽
   * @param ev
   */
  const onTreeDragStart = (ev) => {
    setCurrentDraggingId(ev.target.id);
    ev.dataTransfer.setData(CONST.CHANNEL.MOVE, ev.target.id);
    ev.stopPropagation();
  };

  /**
   * 拖拽区域样式高亮
   *
   * @param ev
   */
  const highLight = (ev) => {
    const [, type, $wrap] = findTargetDropDom(ev, currentDraggingId);
    let $dom = $wrap;
    if (type === "before" || type == "next") {
      $dom = $wrap.children[0] as HTMLElement;
    }

    // 如果目标元素没有变化，则不执行后续操作
    if (oldHightLightData.$dom === $dom && oldHightLightData.type === type) {
      return;
    }

    clearHightLight(oldHightLightData);

    setOldHightLightData({ $dom, type });

    if (type === "inner") {
      $dom.style.background = "#40abff";
    } else if (type === "before") {
      $dom.style.borderTop = "3px solid blue";
      $dom.style.marginTop = "-2px";
    } else if (type === "next") {
      $dom.style.borderBottom = "3px solid blue";
      $dom.style.marginBottom = "-2px";
    }
  };

  /**
   * 基于某个 block 为锚点添加 block
   * @param target
   * @param block
   * @param type
   */
  const insertToBlock = (
    target: IBlock,
    block: IBlock,
    type: TInsertToBlockType = "next"
  ) => {
    if (!target) throw "target is required; fn insertToBlock";
    if (!block) throw "block is required; fn insertToBlock";
    if (type === "next") {
      const list = target.parent?.children || dataTree;
      const index = list.findIndex((block) => block.id === target.id);
      list.splice(index + 1, 0, block);
    } else if (type === "before") {
      const list = target.parent?.children || dataTree;
      const index = list.findIndex((block) => block.id === target.id);
      list.splice(index, 0, block);
    } else {
      if (target.children) {
        target.children = [...target.children, block];
      }
    }
    setDataTree(cloneDeep(dataTree));
  };

  /**
   * 落到树上
   * @param ev
   */
  const onTreeDrop = (ev) => {
    try {
      ev.preventDefault();
      ev.stopPropagation();
      const channelCopyStr = ev.dataTransfer.getData(CONST.CHANNEL.COPY);
      const channelMoveStr = ev.dataTransfer.getData(CONST.CHANNEL.MOVE);
      const [id, type] = findTargetDropDom(ev, currentDraggingId);
      if (channelCopyStr) {
        const blockMeta: IBlockMeta = JSON.parse(channelCopyStr);
        insertToBlock(getByID(dataTree, id), makeBlock(blockMeta), type);
      } else if (channelMoveStr) {
        const blockId = channelMoveStr;
        // 如果目标 ID 和 要移动的 ID 相同，则表示无需移动
        if (blockId !== id) {
          const _block = getByID(dataTree, blockId);
          deleteByID(dataTree, blockId);
          insertToBlock(getByID(dataTree, id), _block, type);
        }
      }
    } finally {
      setCurrentDraggingId(null);
      clearHightLight(oldHightLightData);
    }
  };

  const _genBlock = (item, isLast) => {
    const { id, name, children } = item;
    return (
      <div
        className={"block-wrap " + CONST.CLASS.BLOCK}
        key={id}
        data-id={id}
        onDrop={onTreeDrop}
        onDragOver={onTreeDragOver}
      >
        <div
          id={id}
          className="block"
          draggable="true"
          onDragStart={onTreeDragStart}
        >
          <div className="title">{name}</div>
          {children ? (
            <div className={"block-frame " + CONST.CLASS.FRAME} data-id={id}>
              {children.map((i, index) =>
                _genBlock(i, index === children.length - 1)
              )}
            </div>
          ) : null}
        </div>
        {!isLast ? <div className="block-arrow"></div> : null}
      </div>
    );
  };

  return (
    <Fragment>
      {dataTree.map((i, index) => _genBlock(i, index === dataTree.length - 1))}
    </Fragment>
  );
}

function App() {
  return (
    <Fragment>
      {renderMeta()}
      {renderContainer()}
    </Fragment>
  );
}

ReactDom.render(<App />, document.getElementById("app"));
