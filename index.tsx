/// <reference path="index.d.ts"/>

import * as React from 'react';
import * as ReactDom from 'react-dom';
import { cloneDeep } from 'lodash';

import { CONST, blockMetaList, MockDataTree } from './const';
import { link, makeBlock, getByID, findTargetDropDom, clearHightLight } from './util';

import './index.scss';

const { useEffect, useState, Fragment } = React;

/**
 * 从列表中开始拖拽
 * @param ev 
 */
function onMetaDragStart(ev) {
  const blockMata = blockMetaList.find(blockMata => blockMata.id === ev.target.id)
  ev.dataTransfer.setData(CONST.CHANNEL.COPY, JSON.stringify(blockMata));
}

/**
 * 渲染左侧控件列表
 */
function renderMeta() {
  const list = blockMetaList.map(blockMeta =>
    <div draggable="true" key={blockMeta.id} id={blockMeta.id} className="block-meta" onDragStart={onMetaDragStart}>{blockMeta.name}</div>
  )
  return <div id="block-meta-list">{list}</div>
}

/**
 * 渲染工作区
 */
function renderContainer() {
  /**
   * 树数据
   */
  const [dataTree, setDataTree] = useState<IBlock[]>(MockDataTree);

  /**
  * 高亮 dom 数据集
  */
  const [oldHightLightData, setOldHightLightData] = useState<IOldHightLightData>({})

  useEffect(() => {
    link(dataTree);
  }, [])

  /**
   * 落到 container 上
   * @param ev 
   */
  const onBlankDragOver = (ev) => {
    highLightRoot();
    ev.preventDefault();
  }

  /**
   * 落到 container 上
   * @param ev 
   */
  function onBlankDrop(ev) {
    ev.preventDefault();
    clearHightLight(oldHightLightData);
    const channelCopyStr = ev.dataTransfer.getData(CONST.CHANNEL.COPY);
    const channelMoveStr = ev.dataTransfer.getData(CONST.CHANNEL.MOVE);

    if (channelCopyStr) {
      const blockMata: IBlockMata = JSON.parse(channelCopyStr);
      insertToRoot(makeBlock(blockMata));
    } else if (channelMoveStr) {
      const blockId = channelMoveStr;
      const targetBlock = getByID(dataTree, blockId);
      // 删除原来的控件
      deleteByID(dataTree, blockId);
      // 将控件移动到树的尾部
      insertToRoot(targetBlock);
    }
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

      clearHightLight(oldHightLightData);

      setOldHightLightData({ $dom, type: 'next' })

      $dom.style.borderBottom = '3px solid blue';
      $dom.style.marginBottom = '-2px';
    }
  }

  /**
   * 控件添加到 根
   * @param block 
   */
  function insertToRoot(block: IBlock, type: TInsertToRoot = 'next') {
    if (type === 'next') {
      setDataTree([...dataTree, block]);
    } else {
      setDataTree([block, ...dataTree]);
    }
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
    setDataTree(cloneDeep(dataTree))
  }

  return (
    <div id="container" onDrop={onBlankDrop} onDragOver={onBlankDragOver}>
      <RenderTree
        dataTree={dataTree}
        setDataTree={setDataTree}
        oldHightLightData={oldHightLightData}
        setOldHightLightData={setOldHightLightData}
        deleteByID={deleteByID}
      />
    </div>
  )
}

/**
 * 渲染容器控件树
 */
function RenderTree(props: IRenderTreeProps) {

  const {
    dataTree,
    setDataTree,
    oldHightLightData,
    setOldHightLightData,
    deleteByID
  } = props;

  link(dataTree);

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
    ev.dataTransfer.setData(CONST.CHANNEL.MOVE, ev.target.id);
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

    clearHightLight(oldHightLightData);

    setOldHightLightData({ $dom, type })

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
        target.children = [...target.children, block];
      }
    }
    setDataTree(cloneDeep(dataTree))
  }

  /**
   * 落到树上
   * @param ev 
   */
  function onTreeDrop(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    clearHightLight(oldHightLightData);
    const channelCopyStr = ev.dataTransfer.getData(CONST.CHANNEL.COPY);
    const channelMoveStr = ev.dataTransfer.getData(CONST.CHANNEL.MOVE);
    const [id, type] = findTargetDropDom(ev);
    if (channelCopyStr) {
      const blockMata: IBlockMata = JSON.parse(channelCopyStr);
      insertToBlock(getByID(dataTree, id), makeBlock(blockMata), type)
    } else if (channelMoveStr) {
      const blockId = channelMoveStr;
      // 如果目标 ID 和 要移动的 ID 相同，则表示无需移动
      if (blockId !== id) {
        const _block = getByID(dataTree, blockId);
        deleteByID(dataTree, blockId);
        insertToBlock(getByID(dataTree, id), _block, type)
      }
    }
  }

  const _genblock = (item, isLast) => {
    const { id, name, children } = item;
    return (
      <div className={"block-wrap " + CONST.CALSS.BLOCK} key={id} data-id={id} onDrop={onTreeDrop} onDragOver={onTreeDragOver}>
        <div id={id} className="block" draggable="true" onDragStart={onTreeDragStart}>
          <div className="title">{name}</div>
          {children ? (
            <div className={"block-frame " + CONST.CALSS.FRAME} data-id={id}>
              {children.map((i, index) => _genblock(i, index === children.length - 1))}
            </div>
          ) : null}
        </div>
        {!isLast ? <div className="block-arrow"></div> : null}
      </div>
    )
  }
  return (
    <Fragment>
      {dataTree.map((i, index) => _genblock(i, index === dataTree.length - 1))}
    </Fragment>
  )
}


function App() {
  return (
    <Fragment>
      {renderMeta()}
      {renderContainer()}
    </Fragment>
  )
}

ReactDom.render(<App />, document.getElementById('app'))