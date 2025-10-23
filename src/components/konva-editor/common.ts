import Konva from "konva"

// 默认多边形裁剪圆角半径
export const DEFAULT_POLYGON_RADIUS = 10
export const emptyBg = new URL('./assets/empty-bg.png', import.meta.url).href // 空图片
// 图片属性
export const IMAGE_ATTRS = ['fillPatternImage', 'image']
// 图片属性对应的url属性
export const IMAGE_URL_ATTRS = ['fillPatternImageUrl', 'imageUrl']

// 字体列表
export const FONT_LIST = [
  {
    label: '默认',
    value: 'auto',
  },
]

/**
 * 生成随机字符串
 * @returns 随机字符串
 */
export const randomString = () => {
  return Math.random().toString(36).substring(2, 15)
}


// 选择图片上传
export const selectImage = (
  {
    uploadStartCb,
    uploadSuccessCb,
    uploadErrorCb,
  }: {
    uploadStartCb?: () => void
    uploadSuccessCb?: (url: string) => void
    uploadErrorCb?: (error: any) => void
  },
  shape?: any
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
              uploadStartCb?.()
              // 模拟上传
              try {
                const url = URL.createObjectURL(file)
                uploadSuccessCb?.(url)
                resolve(url)
              } catch (error) {
                uploadErrorCb?.(error)
                reject(error)
              }
            }
            img.src = event.target?.result as string
          }
          reader.readAsDataURL(file)
        } else {
          reject(new Error('未选择图片'))
        }
      }
      input.onerror = reject
      input.click()
    } catch (error) {
      reject(error)
    }
  })
}

// 加载图片
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  const url = src || emptyBg
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// 判断图片是否是当前域名图片
export const isSameOriginImage = (src: string): boolean => {
  try {
    const imgUrl = new URL(src, window.location.href)
    return imgUrl.hostname === window.location.hostname
  } catch (e) {
    return false
  }
}

// 根据id递归获取图层
export const getShapeById = (
  id: string,
  shapes: any[],
  alwaysReturnSelf = false // 是否总是返回自身
) => {
  if (!shapes) return null
  for (const shape of shapes) {
    if (shape.config.id === id) {
      if (alwaysReturnSelf || shape.config.draggable) {
        return shape
      }
    } else if (shape.children) {
      const result: any = getShapeById(id, shape.children, alwaysReturnSelf)
      if (result) {
        if (alwaysReturnSelf || result.config.draggable) {
          return result
        } else if (alwaysReturnSelf || shape.config.draggable) {
          return shape
        }
      }
    }
  }
  return null
}

// 根据id递归删除图层
export const deleteShapeById = (id: string, shapes: any[]) => {
  for (const shape of shapes) {
    if (shape.config.id === id) {
      shapes.splice(shapes.indexOf(shape), 1)
    } else if (shape.children) {
      deleteShapeById(id, shape.children)
    }
  }
}

// 根据id获取父级， 无父级则返回null
export const getParentShapeById = (
  id: string,
  shapes: any[],
  alwaysReturnSelf = false
) => {
  for (const shape of shapes) {
    if (shape.config.id === id) {
      return null
    } else if (shape.children) {
      const result = getShapeById(id, shape.children, true)
      if (result && (alwaysReturnSelf || shape.config.draggable)) {
        return shape
      }
    }
  }
  return null
}

/**
 * 递归设置图层层级
 * @param shapes 图层数据
 * @param stage 画布舞台
 */
export const setShapeZIndex = (shapes: any[], stage: any) => {
  shapes.forEach((shape) => {
    if (shape.config.zIndex && typeof shape.config.zIndex === 'number') {
      const node = stage.findOne(`#${shape.config.id}`)
      if (node) {
        node.zIndex(shape.config.zIndex)
      }
    }
    if (shape.children) {
      setShapeZIndex(shape.children, stage)
    }
  })
}

/**
 * 根据id获取图层索引与索引所在列表
 * @param id 图层id
 * @param shapes 图层数据
 * @returns 图层索引与索引所在列表
 */
export const getShapeIndexAndListById = (
  id: string,
  shapes: any[]
): { index: number; list: any[] } => {
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i]
    if (shape.config.id === id) {
      return { index: i, list: shapes }
    } else if (shape.children) {
      const result = getShapeIndexAndListById(id, shape.children)
      if (result.index !== -1) {
        return result
      }
    }
  }
  return { index: -1, list: [] }
}

// 解析字体样式
export const parseFontStyle = (style: string) => {
  const parts = style.split(' ')
  let fontStyle = 'normal'
  let fontWeight = 'normal'

  parts.forEach((part) => {
    if (part === 'normal' || part === 'italic' || part === 'oblique') {
      fontStyle = part
    } else if (
      /^\d+$/.test(part) ||
      part === 'bold' ||
      part === 'lighter' ||
      part === 'bolder'
    ) {
      fontWeight = part
    }
  })

  return { fontStyle, fontWeight }
}

// 生成描边css
export const generateStrokeCss = (w: number, s: string) => {
  const shadows = []
  const range = Math.floor(w / 2.4)
  for (let x = -range; x <= range; x++) {
    for (let y = -range; y <= range; y++) {
      if (x === 0 && y === 0) continue
      shadows.push(`${x}px ${y}px 0 ${s}`)
    }
  }
  return shadows.join(',\n')
}

/**
 * 生成多边形点集合
 * @param sides 多边形边数
 * @param size 多边形外接圆半径
 * @returns 多边形点集合
 */
export const generatePolygonPoints = (
  sides: number,
  size: number,
  origin: 'center' | 'top-left' = 'top-left'
): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = []
  const angleOffset = Math.PI / sides // 30度角，让六边形"立起来"

  // 计算六边形六个点坐标（顺时针）
  for (let i = 0; i < sides; i++) {
    const angle = angleOffset + ((i * Math.PI) / sides) * 2 // 每个角度相差60度
    const x = size * Math.cos(angle)
    const y = size * Math.sin(angle)
    points.push({ x, y })
  }

  if (origin === 'center') {
    return points
  }

  // 找到最小的x和y，用于平移
  const minX = Math.min(...points.map((p) => p.x))
  const minY = Math.min(...points.map((p) => p.y))
  // 平移所有点，使得左上角为原点
  return points.map((p) => ({
    x: p.x - minX,
    y: p.y - minY,
  }))
}

// 按path中的点获取实际宽高
export const getActualSizeByPath = (points: { x: number; y: number }[]) => {
  const minX = Math.min(...points.map((p) => p.x))
  const minY = Math.min(...points.map((p) => p.y))
  const maxX = Math.max(...points.map((p) => p.x))
  const maxY = Math.max(...points.map((p) => p.y))
  return {
    width: maxX - minX,
    height: maxY - minY,
  }
}
// 生成圆角多边形路径 用于v-path
export const generateSmoothRoundedPath = (
  points: { x: number; y: number }[],
  radius: number
): string => {
  const len = points.length
  if (len < 3) return ''

  let d = ''

  for (let i = 0; i < len; i++) {
    const prev = points[(i - 1 + len) % len]
    const curr = points[i]
    const next = points[(i + 1) % len]

    const vecA = { x: curr.x - prev.x, y: curr.y - prev.y }
    const vecB = { x: next.x - curr.x, y: next.y - curr.y }

    const lenA = Math.hypot(vecA.x, vecA.y)
    const lenB = Math.hypot(vecB.x, vecB.y)

    const normA = { x: vecA.x / lenA, y: vecA.y / lenA }
    const normB = { x: vecB.x / lenB, y: vecB.y / lenB }

    const r = Math.min(radius, lenA / 2, lenB / 2)

    const p1 = {
      x: curr.x - normA.x * r,
      y: curr.y - normA.y * r,
    }
    const p2 = {
      x: curr.x + normB.x * r,
      y: curr.y + normB.y * r,
    }

    if (i === 0) {
      d += `M${p1.x},${p1.y}`
    } else {
      d += `L${p1.x},${p1.y}`
    }

    // 用 Q（二次贝塞尔）模拟圆角过渡
    d += `Q${curr.x},${curr.y} ${p2.x},${p2.y}`
  }

  d += 'Z'
  return d
}

/**
 * 获取 SVG path 的宽高
 * @param pathStr SVG path 的 d 属性字符串
 * @returns { width: number, height: number }
 */
export function getPathBoundingSize(pathStr: string): {
  width: number
  height: number
} {
  // 创建一个临时的 SVG 元素
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  path.setAttribute('d', pathStr)
  svg.appendChild(path)
  svg.style.position = 'absolute'
  svg.style.visibility = 'hidden'
  svg.style.pointerEvents = 'none'
  document.body.appendChild(svg)

  const bbox = path.getBBox()
  document.body.removeChild(svg)

  return {
    width: bbox.width,
    height: bbox.height,
  }
}

// 创建多边形圆角裁剪函数 用于v-group的clipFunc
export const createSmoothRoundedClipFunc = (
  points: { x: number; y: number }[],
  radius: number
) => {
  return function (ctx: CanvasRenderingContext2D) {
    if (points.length < 3) return

    const len = points.length

    for (let i = 0; i < len; i++) {
      const prev = points[(i - 1 + len) % len]
      const curr = points[i]
      const next = points[(i + 1) % len]

      const vecA = { x: curr.x - prev.x, y: curr.y - prev.y }
      const vecB = { x: next.x - curr.x, y: next.y - curr.y }

      const lenA = Math.hypot(vecA.x, vecA.y)
      const lenB = Math.hypot(vecB.x, vecB.y)

      const normA = { x: vecA.x / lenA, y: vecA.y / lenA }
      const normB = { x: vecB.x / lenB, y: vecB.y / lenB }

      const r = Math.min(radius, lenA / 2, lenB / 2)

      const p1 = {
        x: curr.x - normA.x * r,
        y: curr.y - normA.y * r,
      }
      const p2 = {
        x: curr.x + normB.x * r,
        y: curr.y + normB.y * r,
      }

      if (i === 0) {
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
      } else {
        ctx.lineTo(p1.x, p1.y)
      }

      // 二次贝塞尔曲线作为圆角过渡
      ctx.quadraticCurveTo(curr.x, curr.y, p2.x, p2.y)
    }

    ctx.closePath()
  }
}

// 创建圆形裁剪函数 用于v-group的clipFunc
export const createCircleClipFunc = (x: number, y: number, radius: number) => {
  return function (ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2, false)
    ctx.closePath()
  }
}

// 创建圆角矩形裁剪函数 用于v-group的clipFunc
export const createRoundedRectClipFunc = (
  width: number,
  height: number,
  radius: number | number[]
) => {
  return function (ctx: CanvasRenderingContext2D) {
    const w = width
    const h = height

    let [tl, tr, br, bl] =
      typeof radius === 'number' ? [radius, radius, radius, radius] : radius

    ctx.beginPath()

    // 不可超过相邻边中“较长”的一边的一半
    const limitRadius = (r: number, edgeA: number, edgeB: number) =>
      Math.min(r, edgeA / 2)

    tl = limitRadius(tl, w, h)
    tr = limitRadius(tr, w, h)
    br = limitRadius(br, w, h)
    bl = limitRadius(bl, w, h)

    ctx.moveTo(tl, 0)

    // 上边
    ctx.lineTo(w - tr, 0)
    if (tr > 0) ctx.arcTo(w, 0, w, tr, tr)

    // 右边
    ctx.lineTo(w, h - br)
    if (br > 0) ctx.arcTo(w, h, w - br, h, br)

    // 下边
    ctx.lineTo(bl, h)
    if (bl > 0) ctx.arcTo(0, h, 0, h - bl, bl)

    // 左边
    ctx.lineTo(0, tl)
    if (tl > 0) ctx.arcTo(0, 0, tl, 0, tl)

    ctx.closePath()
  }
}

// 递归深度克隆(包括函数)， 防止引用类型数据修改
export const deepClone = (obj: any, seen = new WeakMap()): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj // 基础类型和 null 直接返回
  }

  // 函数/img对象以及基本类型数据不克隆
  if (typeof obj === 'function' || obj instanceof HTMLImageElement) {
    return obj
  }

  // 初始化克隆目标
  const clone: any = Array.isArray(obj) ? [] : {}

  // 递归克隆属性
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key], seen)
    }
  }

  return clone
}

/**
 * 相对坐标转绝对坐标
 * @param relativePoint 相对坐标
 * @returns 绝对坐标
 */
export function relativeToAbsolute(
  node: any,
  relativePoint: { x: number; y: number }
) {
  return node.getAbsoluteTransform().point(relativePoint)
}

/**
 * 绝对坐标转相对坐标
 * @param node 节点
 * @param absolutePoint 绝对坐标
 * @returns 相对坐标
 */
export function absoluteToRelative(
  node: any,
  absolutePoint: { x: number; y: number }
) {
  return node.getAbsoluteTransform().copy().invert().point(absolutePoint)
}

/**
 * 判断是否超出父级范围以外，
 * 并要求元素在父容器内至少保留宽/高的1/2或50px（取最大值）
 * @param node 当前节点
 * @param parentNode 父级节点
 * @param nodeBox 当前节点范围
 * @returns 是否超出父级范围以外
 */
export const isOutOfParentRange = (
  node: any,
  parentNode?: any,
  nodeBox?: any
): boolean => {
  const stage = node.getStage()
  let parent = parentNode || stage
  let parentBox = {
    x: parent.x(),
    y: parent.y(),
    width: parent.width(),
    height: parent.height(),
  }
  if (parentBox.width === 0 || parentBox.height === 0) {
    parent = stage
    parentBox = {
      x: stage.x(),
      y: stage.y(),
      width: stage.width(),
      height: stage.height(),
    }
  }
  // 获取当前节点相对于父级节点的位置
  const childBox =
    nodeBox ||
    node.getClientRect({
      skipShadow: true,
      skipStroke: true,
      relativeTo: parent,
    })
  // 节点类型
  const nodeType = node.getClassName()
  // 是否不允许超出边界
  const isNotAllowOutOfParentRange = ['Text'].includes(nodeType)
  // 最小可见宽、高
  const minVisibleWidth = isNotAllowOutOfParentRange
    ? childBox.width
    : Math.max(50, childBox.width / 2)
  const minVisibleHeight = isNotAllowOutOfParentRange
    ? childBox.height
    : Math.max(50, childBox.height / 2)

  return (
    childBox.x + minVisibleWidth > parentBox.x + parentBox.width ||
    childBox.x + childBox.width - minVisibleWidth < parentBox.x ||
    childBox.y + minVisibleHeight > parentBox.y + parentBox.height ||
    childBox.y + childBox.height - minVisibleHeight < parentBox.y
  )
}

/**
 * 创建transform限制函数
 * @param parentId 父级id
 * @returns 限制函数
 */
export function createTransformBoundFunc(node: any, parentId?: string) {
  return function (oldBox: any, newBox: any) {
    if (newBox.width < 0 || newBox.height < 0) {
      return oldBox
    }
    const stage = node.getStage()
    // 如果父级id存在，则获取父级节点，否则获取stage
    const parentNode = parentId ? stage?.findOne('#' + parentId) : stage
    const isOut = isOutOfParentRange(node, parentNode, newBox)

    let isOverflow = false
    if (node.getClassName() === 'Text') {
      const originalText = node.text().replace(/\s+/g, '')
      const displayedText = node.textArr
        ?.map((item: any) => item.text)
        .join('')
        .replace(/\s+/g, '')
      isOverflow = displayedText !== originalText
    }

    return isOut || isOverflow ? oldBox : newBox
  }
}

/**
 * 创建拖动限制函数 dragBoundFunc 当前选中的其中一个移动时，其他偏移量保持一致，且某一个超出边界，其他也停止移动
 * @description 限制拖动范围，不能超出父级范围以外，
 * 并要求元素在父容器内至少保留宽/高的1/2或50px（取最大值）
 * @param nodes 当前选中的node集合
 * @params boundSpace 边界留白
 * @returns 拖动限制函数
 */
export function createDragBoundFuncByMultiple(
  nodes: any[],
  boundSpace?: number
) {
  return function (this: any, pos: { x: number; y: number }) {
    const node = this
    const stage = node.getStage()
    const parentBox = {
      x: stage.x(),
      y: stage.y(),
      width: stage.width(),
      height: stage.height(),
    }

    // 偏移量
    let dx = pos.x - node.x()
    let dy = pos.y - node.y()

    const selectedNewBoxs = nodes.map((sNode) => {
      // 获取当前节点相对于父级节点的位置
      const sNodeBox = sNode.getClientRect({
        relativeTo: sNode.getParent(),
        skipShadow: true,
        skipStroke: true,
      })
      // 节点类型
      const nodeType = sNode.getClassName()
      // 是否不允许超出边界
      const isNotAllowOutOfParentRange = ['Text'].includes(nodeType)
      // 最小可见宽、高
      const minVisibleWidth =
        typeof boundSpace === 'number'
          ? sNode.width() - boundSpace * 2
          : isNotAllowOutOfParentRange
            ? sNode.width()
            : Math.max(50, sNode.width() / 2)
      const minVisibleHeight =
        typeof boundSpace === 'number'
          ? sNode.height() - boundSpace * 2
          : isNotAllowOutOfParentRange
            ? sNode.height()
            : Math.max(50, sNode.height() / 2)
      return {
        node: sNode,
        isDrag: sNode.id() === node.id(),
        x: sNodeBox.x,
        y: sNodeBox.y,
        width: sNodeBox.width,
        height: sNodeBox.height,
        minVisibleWidth,
        minVisibleHeight,
      }
    })
    const curDragNodeBox = selectedNewBoxs.find((s) => s.isDrag)
    const curDragNodeAbsP = curDragNodeBox?.node.getAbsolutePosition()
    const { x, y, minVisibleWidth, minVisibleHeight, width, height } =
      curDragNodeBox || {}
    const otherNodes = selectedNewBoxs.filter((s) => !s.isDrag)

    // 限制其他节点移动范围
    otherNodes.forEach((s) => {
      const sAbsP = s.node.getAbsolutePosition()
      // 子节点需要计算偏移量
      let sDx = 0
      let sDy = 0
      // 计算基准点
      let baseX = s.x
      let baseY = s.y
      if (
        s.node.getParent() !== s.node.getLayer() &&
        node.getParent() !== node.getLayer() &&
        s.node.getParent() !== node.getParent()
      ) {
        sDx = sAbsP.x - curDragNodeAbsP.x + (x - s.x)
        sDy = sAbsP.y - curDragNodeAbsP.y + (y - s.y)
      } else if (
        s.node.getParent() === s.node.getLayer() &&
        node.getParent() !== node.getLayer()
      ) {
        const relP = absoluteToRelative(node.getParent(), {
          x: s.x,
          y: s.y,
        })
        baseX = relP.x
        baseY = relP.y
      } else if (
        s.node.getParent() !== s.node.getLayer() &&
        node.getParent() === node.getLayer()
      ) {
        baseX = sAbsP.x
        baseY = sAbsP.y
      }
      const newSNodeBox = {
        x: baseX + dx + sDx,
        y: baseY + dy + sDy,
        width: s.width,
        height: s.height,
      }
      if (newSNodeBox.x + s.minVisibleWidth > parentBox.x + parentBox.width) {
        dx = parentBox.x + parentBox.width - s.minVisibleWidth - baseX - sDx
      } else if (
        newSNodeBox.x + newSNodeBox.width - s.minVisibleWidth <
        parentBox.x
      ) {
        dx = parentBox.x + s.minVisibleWidth - (baseX + s.width) - sDx
      }
      if (newSNodeBox.y + s.minVisibleHeight > parentBox.y + parentBox.height) {
        dy = parentBox.y + parentBox.height - s.minVisibleHeight - baseY - sDy
      } else if (
        newSNodeBox.y + newSNodeBox.height - s.minVisibleHeight <
        parentBox.y
      ) {
        dy = parentBox.y + s.minVisibleHeight - (baseY + s.height) - sDy
      }
    })

    const newDragNodeBox = {
      x: x + dx,
      y: y + dy,
      width,
      height,
    }
    // 限制当前节点移动范围
    if (newDragNodeBox.x + minVisibleWidth > parentBox.x + parentBox.width) {
      dx = parentBox.x + parentBox.width - minVisibleWidth - x
    } else if (newDragNodeBox.x + width - minVisibleWidth < parentBox.x) {
      dx = parentBox.x + minVisibleWidth - (x + width)
    }
    if (newDragNodeBox.y + minVisibleHeight > parentBox.y + parentBox.height) {
      dy = parentBox.y + parentBox.height - minVisibleHeight - y
    } else if (newDragNodeBox.y + height - minVisibleHeight < parentBox.y) {
      dy = parentBox.y + minVisibleHeight - (y + height)
    }

    return { x: node.x() + dx, y: node.y() + dy }
  }
}

/**
 * 创建拖动限制函数 dragBoundFunc
 * @description 限制拖动范围，不能超出父级范围以外，
 * 并要求元素在父容器内至少保留宽/高的1/2或50px（取最大值）
 * @param parentId 父级id
 * @params boundSpace 边界留白
 * @returns 拖动限制函数
 */
export function createDragBoundFunc(parentId?: string, boundSpace?: number) {
  return function (this: any, pos: { x: number; y: number }) {
    const node = this
    const stage = node.getStage()
    // 如果父级id存在，则获取父级节点，否则获取stage
    let parentNode = parentId ? stage?.findOne('#' + parentId) : stage
    let parentBox = {
      x: parentNode.x(),
      y: parentNode.y(),
      width: parentNode.width(),
      height: parentNode.height(),
    }
    if (parentBox.width === 0 || parentBox.height === 0) {
      parentNode = stage
      parentBox = {
        x: parentNode.x(),
        y: parentNode.y(),
        width: parentNode.width(),
        height: parentNode.height(),
      }
    }
    // 获取当前节点相对于父级节点的位置
    const childBox = node.getClientRect({
      relativeTo: node.getParent(),
      skipShadow: true,
      skipStroke: true,
    })
    // 偏移量
    const dx = pos.x - node.x()
    const dy = pos.y - node.y()

    // 计算新位置
    let newX = node.x() + dx
    let newY = node.y() + dy
    const newBox = {
      x: childBox.x + dx,
      y: childBox.y + dy,
      width: childBox.width,
      height: childBox.height,
    }
    // 节点类型
    const nodeType = node.getClassName()
    // 是否不允许超出边界
    const isNotAllowOutOfParentRange = ['Text'].includes(nodeType)
    // 最小可见宽、高
    const minVisibleWidth =
      typeof boundSpace === 'number'
        ? childBox.width - boundSpace * 2
        : isNotAllowOutOfParentRange
          ? childBox.width
          : Math.max(50, childBox.width / 2)
    const minVisibleHeight =
      typeof boundSpace === 'number'
        ? childBox.height - boundSpace * 2
        : isNotAllowOutOfParentRange
          ? childBox.height
          : Math.max(50, childBox.height / 2)

    // 限制水平移动范围
    if (newBox.x + minVisibleWidth > parentBox.x + parentBox.width) {
      newX =
        node.x() +
        (parentBox.x + parentBox.width - minVisibleWidth - childBox.x)
    } else if (newBox.x + newBox.width - minVisibleWidth < parentBox.x) {
      newX =
        node.x() +
        (parentBox.x + minVisibleWidth - (childBox.x + childBox.width))
    }
    // 限制垂直移动范围
    if (newBox.y + minVisibleHeight > parentBox.y + parentBox.height) {
      newY =
        node.y() +
        (parentBox.y + parentBox.height - minVisibleHeight - childBox.y)
    } else if (newBox.y + newBox.height - minVisibleHeight < parentBox.y) {
      newY =
        node.y() +
        (parentBox.y + minVisibleHeight - (childBox.y + childBox.height))
    }

    return { x: newX, y: newY }
  }
}

/**
 * 递归查找包含图片属性的第一个图层
 * @param shape 图层
 * @returns 包含图片属性的图层
 */
export const findImageShape = (shape: any): any | null => {
  if (!shape?.config) return null
  const hasImage = IMAGE_ATTRS.some((key) => key in shape.config)
  if (hasImage) return shape
  if (Array.isArray(shape.children)) {
    for (const child of shape.children) {
      const found = findImageShape(child)
      if (found) return found
    }
  }
  return null
}

/**
 * 递归查找所有包含图片属性的图层
 * @param shape 图层
 * @returns 包含图片属性的图层
 */
export const findAllImageShapesByUrl = (shape: any): any[] => {
  const imageShapes: any[] = []
  const isImageShape = (s: any) => {
    if (!s?.config) return false
    return IMAGE_URL_ATTRS.some((key) => key in s.config)
  }
  const traverse = (node: any) => {
    if (!node) return

    if (isImageShape(node)) {
      imageShapes.push(node)
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }
  traverse(shape)
  return imageShapes
}

/**
 * 递归查找所有的文本节点
 * @param shape 图层
 * @returns 文本节点
 */
export const findAllTextShapes = (shape: any): any[] => {
  const textShapes: any[] = []
  const isTextShape = (s: any) => {
    return s?.type === 'v-text'
  }
  const traverse = (node: any) => {
    if (!node) return

    if (isTextShape(node)) {
      textShapes.push(node)
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }
  traverse(shape)
  return textShapes
}

/**
 * 根据容器宽高 & 角度计算 Konva 渐变起始/结束点 可根据设计稿值转换json配置所需渐变参数
 * @param width 宽度
 * @param height 高度
 * @param angleDeg cssAngleDeg CSS标准下的角度（如linear-gradient(270deg, ...)）
 * @returns { start, end }
 */
export function getGradientPointsByAngle(
  width: number,
  height: number,
  angleDeg: number
) {
  // 转为 Canvas 坐标系方向（450 - deg 是关键换算）
  const rad = ((450 - angleDeg) % 360) * (Math.PI / 180)

  const centerX = width / 2
  const centerY = height / 2

  const halfLen = Math.sqrt(width * width + height * height) / 2
  const dx = Math.cos(rad) * halfLen
  const dy = Math.sin(rad) * halfLen

  const pos = {
    start: {
      x: centerX - dx,
      y: centerY - dy,
    },
    end: {
      x: centerX + dx,
      y: centerY + dy,
    },
  }
  // 点不能超出容器
  if (pos.start.x < 0) {
    pos.start.x = 0
  }
  if (pos.start.y < 0) {
    pos.start.y = 0
  }
  if (pos.end.x > width) {
    pos.end.x = width
  }
  if (pos.end.y > height) {
    pos.end.y = height
  }
  if (pos.start.x > width) {
    pos.start.x = width
  }
  if (pos.start.y > height) {
    pos.start.y = height
  }
  if (pos.end.x < 0) {
    pos.end.x = 0
  }
  if (pos.end.y < 0) {
    pos.end.y = 0
  }
  return pos
}

/**
 * 递归判断对象中非image/function属性是否一致，一致则返回true，否则返回false
 * @param obj1 对象1
 * @param obj2 对象2
 * @param ignoreKeys 需要忽略的属性
 * @param changeCb 变化回调
 * @returns 是否一致
 */
export const isSameObject = (
  obj1: any,
  obj2: any,
  ignoreKeys: string[] = [],
  changeCb?: (key: string, val1: any, val2: any) => void,
  seen = new WeakSet()
): boolean => {
  const ignoreKeysSet = new Set([...ignoreKeys])

  // 引用类型循环检测
  if (typeof obj1 === 'object' && obj1 !== null) {
    if (seen.has(obj1)) return true
    seen.add(obj1)
  }

  // 类型或 null 判断
  if (obj1 === obj2) return true
  if (obj1 === null || obj2 === null) return false
  if (typeof obj1 !== typeof obj2) return false

  // 函数 / 图片直接跳过比较
  if (typeof obj1 === 'function' && typeof obj2 === 'function') return true
  if (obj1?.tagName === 'IMG' && obj2?.tagName === 'IMG') return true

  // 非对象直接比较
  if (typeof obj1 !== 'object') return obj1 === obj2

  // key 数量对比（排除 ignoreKeys）
  const keys1 = Object.keys(obj1).filter((k) => !ignoreKeysSet.has(k))
  const keys2 = Object.keys(obj2).filter((k) => !ignoreKeysSet.has(k))
  if (keys1.length !== keys2.length) return false

  let isSame = true

  for (const key of keys1) {
    const val1 = obj1[key]
    const val2 = obj2[key]

    // 函数/图片类型直接跳过
    if (
      (typeof val1 === 'function' && typeof val2 === 'function') ||
      (val1?.tagName === 'IMG' && val2?.tagName === 'IMG')
    ) {
      continue
    }

    // 文本高度变化不记录
    if (key === 'height' && 'text' in obj1) continue

    if (typeof val1 === 'object' && typeof val2 === 'object') {
      if (!isSameObject(val1, val2, ignoreKeys, changeCb, seen)) {
        isSame = false
      }
    } else if (val1 !== val2) {
      changeCb?.(key, val1, val2)
      isSame = false
    }
  }

  return isSame
}

// 将 CSS 色值解析为 RGBA
export function parseCssColorToRGBA(
  color: any
): { r: number; g: number; b: number; a: number } | null {
  if (!color || typeof color !== 'string') return null
  const c = color.trim()
  // #RGB / #RGBA / #RRGGBB / #RRGGBBAA
  if (c[0] === '#') {
    const hex = c.slice(1)
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1
      return { r, g, b, a }
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      return { r, g, b, a }
    }
  }
  // rgb/rgba
  const rgbMatch = c.match(/^rgba?\(([^)]+)\)$/i)
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((v) => v.trim())
    if (parts.length >= 3) {
      const r = Math.max(0, Math.min(255, parseFloat(parts[0])))
      const g = Math.max(0, Math.min(255, parseFloat(parts[1])))
      const b = Math.max(0, Math.min(255, parseFloat(parts[2])))
      const a =
        parts.length >= 4 ? Math.max(0, Math.min(1, parseFloat(parts[3]))) : 1
      return { r, g, b, a }
    }
  }
  // hsl/hsla -> 使用浏览器解析
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#000'
    ctx.fillStyle = c
    const norm = ctx.fillStyle // 规范化后的 rgb(a)
    const m = /^rgba?\(([^)]+)\)$/i.exec(norm)
    if (m) {
      const parts = m[1].split(',').map((v) => v.trim())
      const r = parseFloat(parts[0])
      const g = parseFloat(parts[1])
      const b = parseFloat(parts[2])
      const a = parts.length >= 4 ? parseFloat(parts[3]) : 1
      return { r, g, b, a }
    }
  } catch (err) {
    // ignore
  }
  return null
}

// 计算 sRGB 相对亮度（0=黑 1=白）
export function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const R = toLinear(r)
  const G = toLinear(g)
  const B = toLinear(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

// 透明色在白底上的合成（避免用半透明色作为光标导致不可读）
export function compositeOverWhite(c: {
  r: number
  g: number
  b: number
  a: number
}) {
  const a = isFinite(c.a) ? c.a : 1
  if (a >= 1) return { r: c.r, g: c.g, b: c.b, a: 1 }
  const r = Math.round(c.r * a + 255 * (1 - a))
  const g = Math.round(c.g * a + 255 * (1 - a))
  const b = Math.round(c.b * a + 255 * (1 - a))
  return { r, g, b, a: 1 }
}

// 从节点的 stroke/fill 中挑更“深”的色，用作光标颜色
export function pickDarkerCaretColor(node: any): string {
  const strokeStr = node?.stroke?.() || '#ffffff'
  const fillStr = node?.fill?.() || '#000000'
  const stroke = parseCssColorToRGBA(strokeStr)
  const fill = parseCssColorToRGBA(fillStr)
  if (!stroke && !fill) return 'black'
  if (stroke && !fill) {
    const c = compositeOverWhite(stroke)
    return `rgb(${c.r}, ${c.g}, ${c.b})`
  }
  if (!stroke && fill) {
    const c = compositeOverWhite(fill)
    return `rgb(${c.r}, ${c.g}, ${c.b})`
  }
  // 两者都存在，比较亮度，亮度小者更“深”
  const cs = compositeOverWhite(stroke!)
  const cf = compositeOverWhite(fill!)
  const lumS = relativeLuminance(cs.r, cs.g, cs.b)
  const lumF = relativeLuminance(cf.r, cf.g, cf.b)
  const darker = lumS <= lumF ? cs : cf
  return `rgb(${darker.r}, ${darker.g}, ${darker.b})`
}

// 获取点 (x, y) 绕中心点 (centerX, centerY) 旋转 rotation° 后的新坐标
export function getRotatedPosition(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  rotation: number
) {
  const rad = (rotation * Math.PI) / 180 // 转弧度

  // 平移到中心点为原点
  const dx = x - centerX
  const dy = y - centerY

  // 旋转公式
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad)
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad)

  // 平移回去
  return {
    x: rx + centerX,
    y: ry + centerY,
  }
}


