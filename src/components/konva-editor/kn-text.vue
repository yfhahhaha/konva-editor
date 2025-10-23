<template>
  <v-group>
    <!-- 文本背景 -->
    <v-rect :key="`${innerShapeConfig.id}-bg`" :config="textBgConfig" />
    <v-text
      ref="textNodeRef"
      :config="{
        ...innerShapeConfig,
        draggable: !editing && config.draggable,
        visible: !editing,
        listening: !editing && config.listening,
        width: innerShapeConfig.static?.width || innerShapeConfig.width,
        height: 'auto',
      }"
      @dblclick="handleDblClick"
      @dragstart="handleDragStart"
      @dragmove="handleDragMove"
      @dragend="handleDragEnd"
      @transformstart="handleTransformStart"
      @transform="handleTransform"
      @transformend="handleTransformEnd"
    />
    <template v-if="editing">
      <!-- 选中文本背景 -->
      <v-group
        ref="selectionRectsGroupRef"
        :config="{
          x: innerShapeConfig.x,
          y: innerShapeConfig.y,
          rotation: innerShapeConfig.rotation || 0,
          offsetX: innerShapeConfig.offsetX || 0,
          offsetY: innerShapeConfig.offsetY || 0,
          scaleX: innerShapeConfig.scaleX || 1,
          scaleY: innerShapeConfig.scaleY || 1,
          skewX: innerShapeConfig.skewX || 0,
          skewY: innerShapeConfig.skewY || 0,
          listening: false,
        }"
      >
        <v-rect
          v-for="(rect, i) in selectionRects"
          :key="`${innerShapeConfig.id}-selection-rect-${i}`"
          :config="rect"
        />
      </v-group>
      <!-- 编辑中文本 -->
      <v-text
        ref="editTextNodeRef"
        :config="{
            ...innerShapeConfig,
            draggable: false,
            width: innerShapeConfig.static?.width || innerShapeConfig.width,
            height: 'auto',
          }"
        @dblclick="handleEditDblClick"
        @dbltap="handleEditDblClick"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseUp"
      />
      <!-- 自定义光标 -->
      <v-group
        ref="cursorGroupRef"
        :config="{
          x: innerShapeConfig.x,
          y: innerShapeConfig.y,
          rotation: innerShapeConfig.rotation || 0,
          offsetX: innerShapeConfig.offsetX || 0,
          offsetY: innerShapeConfig.offsetY || 0,
          scaleX: innerShapeConfig.scaleX || 1,
          scaleY: innerShapeConfig.scaleY || 1,
          skewX: innerShapeConfig.skewX || 0,
          skewY: innerShapeConfig.skewY || 0,
          listening: false,
        }"
      >
        <v-line ref="cursorNodeRef" :config="cursorConfig" />
      </v-group>
    </template>
  </v-group>
</template>

<script setup lang="ts">
  import { ref, nextTick, toRefs, watch, reactive, watchEffect } from 'vue'
  import { absoluteToRelative, deepClone, isSameObject, pickDarkerCaretColor, relativeToAbsolute } from './common';

  const props = defineProps<{
    componentId: string
    config: any // 不使用
    shapeConfig: any // 用于双向绑定
    forbidOperate?: boolean // 禁用
  }>()
  const emits = defineEmits(['dblclick', 'dragstart', 'dragmove', 'dragend', 'transformstart', 'transform', 'transformend', 'editing', 'update:shapeConfig'])

  const { componentId, shapeConfig, forbidOperate } = toRefs(props)

  // 内部shapeConfig
  const innerShapeConfig = ref(deepClone(shapeConfig.value))

  // 编辑中
  const editing = ref(false)
  const textareaRef = ref<HTMLTextAreaElement | null>(null)
  const textNodeRef = ref<any>(null)
  const editTextNodeRef = ref<any>(null)
  const cursorNodeRef = ref<any>(null)
  // 操作框节点
  const selectionRectsGroupRef = ref<any>(null)
  // 光标节点
  const cursorGroupRef = ref<any>(null)

  // 背景
  const textBgConfig = ref<any>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
  })

  // 更新文本背景配置
  const updateBgConfig = () => {
    const textNode = textNodeRef.value?.getNode()
    const box = (textNode && {
      x: textNode.x(),
      y: textNode.y(),
      width: textNode.width(),
      height: textNode.height(),
      rotation: textNode.rotation(),
    })
    if (box && innerShapeConfig.value) {
      const padding = Array.isArray(innerShapeConfig.value.bgPadding)
        ? innerShapeConfig.value.bgPadding
        : new Array(4).fill(innerShapeConfig.value.bgPadding || 0)
      const background = innerShapeConfig.value.background || 'rgba(0, 0, 0, 0)'
      const cornerRadius = innerShapeConfig.value.bgCornerRadius || 0

      const rotation = box.rotation || 0
      const rad = (rotation * Math.PI) / 180

      // 计算旋转后 padding 对应的平移偏移
      // 注意：Konva 的 rotation 是绕 (x, y) 旋转
      const dx = -padding[3] * Math.cos(rad) + padding[0] * Math.sin(rad)
      const dy = -padding[3] * Math.sin(rad) - padding[0] * Math.cos(rad)

      textBgConfig.value = {
        x: box.x + dx,
        y: box.y + dy,
        width: box.width + padding[1] + padding[3],
        height: box.height + padding[0] + padding[2],
        fill: background,
        cornerRadius: cornerRadius,
        visible: innerShapeConfig.value.background,
        rotation: rotation,
        offsetX: innerShapeConfig.value.offsetX || 0,
        offsetY: innerShapeConfig.value.offsetY || 0,
        scaleX: innerShapeConfig.value.scaleX || 1,
        scaleY: innerShapeConfig.value.scaleY || 1,
        skewX: innerShapeConfig.value.skewX || 0,
        skewY: innerShapeConfig.value.skewY || 0,
        listening: false,
      }
    }
  }


  // 更新文本框边界
  const updateTextareaBound = (retry = 0) => {
    nextTick(() => {
      const textNode = textNodeRef.value?.getNode()
      if (textNode) {
        if (textNode.width() && textNode.height()) {
          innerShapeConfig.value.width = textNode.width()
          innerShapeConfig.value.height = textNode.height()
          emits('update:shapeConfig', innerShapeConfig.value)
        }
      } else {
        if (retry > 10) return
        setTimeout(() => {
          updateTextareaBound(retry + 1)
        }, 100)
      }
    })
  }

  // 监听innerShapeConfig和textNodeRef的变化，更新背景配置
  watch([() => innerShapeConfig.value, () => textNodeRef.value], () => {
    updateBgConfig()
  }, {
    immediate: true,
    deep: true,
  })

  // 光标
  const cursorConfig = reactive({
    stroke: 'black',
    strokeWidth: 1.5,
    points: [0, 0, 0, 0],
    visible: false,
    opacity: 1
  })
  // 光标闪烁
  const cursorBlinkInterval = ref<any>(null)

  // 选区
  const selectionRects = ref<any[]>([])

  let selectionStart = 0
  let selectionEnd = 0
  let isSelecting = false
  // 中文输入
  const inCompositionMode = ref(false)

  /**
   * Composition start
   */
  function onCompositionStart() {
    inCompositionMode.value = true
  }

  /**
   * Composition update
   */
  function onCompositionUpdate(): void {
    // no thing
  }

  /**
   * Composition end
   */
  function onCompositionEnd(e: any) {
    inCompositionMode.value = false
    const textarea = e.target as HTMLTextAreaElement
    innerShapeConfig.value.text = textarea.value
    onInput(e)
  }

  // 获取文本绘制原点
  function getTextDrawOrigin(textNode: any): { x: number, y: number }[] {
    const textArr = textNode.textArr
    const align = textNode.align()
    const padding = textNode.padding()
    const width = textNode.width()
    const singleLineHeight = Number(textNode.fontSize()) * (Number(textNode.lineHeight()) || 1)

    return textArr.map((line: any, index: number) => {
      const size = textNode.measureSize(line.text)
      const textWidth = Number(size.width)
      // 水平对齐偏移
      let offsetX = padding
      if (align === 'center') {
        offsetX = (width - textWidth) / 2
      } else if (align === 'right') {
        offsetX = width - textWidth - padding
      }

      const x = textNode.x() + offsetX
      const y = textNode.y() + padding + singleLineHeight * index

      return { x, y }
    })
  }

  // 获取字符在指定位置的索引（支持多行）
  function getCharIndexAtPos(posX: number, posY: number): number {
    const textNode = editTextNodeRef.value?.getNode()
    if (!textNode) return 0
    const linePoints = getTextDrawOrigin(textNode)
    // 转文本本地坐标
    const linePointsLocal = linePoints.map((p: any) => ({ x: p.x - textNode.x(), y: p.y - textNode.y() }))
    const lines = textNode.textArr.map((line: any) => line.text)
    const text = textNode.text()
    const singleLineHeight = Number(textNode.fontSize()) * (Number(textNode.lineHeight()) || 1)

    // 构建渲染行到原文索引映射（仅对硬换行\n加1，软换行不加）
    let rawPtr = 0
    const lineInfos = lines.map((ln: string, i: number) => {
      let start = indexOfGrapheme(text, ln, rawPtr)
      if (start === -1) start = rawPtr
      const end = start + splitGraphemes(ln).length
      rawPtr = end
      if (text[rawPtr] === '\n') rawPtr += 1
      return { start, end, x: linePointsLocal[i].x, y: linePointsLocal[i].y, text: ln }
    })

    // 确定点击所在的渲染行
    let lineIndex = 0
    let found = false
    for (let i = 0; i < lineInfos.length; i++) {
      if (posY >= lineInfos[i].y && posY < lineInfos[i].y + singleLineHeight) {
        lineIndex = i
        found = true
        break
      }
    }
    if (!found) {
      if (lineInfos.length === 0) return 0
      lineIndex = posY < lineInfos[0].y ? 0 : lineInfos.length - 1
    }

    const info = lineInfos[lineIndex]
    const x = info.x
    const lineText = info.text
    const itemTexts = splitGraphemes(lineText)
    if (itemTexts.length === 0) {
      return info.start
    }

    const totalLineWidth = textNode.measureSize(lineText).width
    const firstCharWidth = textNode.measureSize(itemTexts[0]).width

    if (posX <= x + firstCharWidth / 2) {
      return info.start
    }
    if (posX >= x + totalLineWidth) {
      return info.end
    }

    let runWidth = 0
    for (let i = 0; i < itemTexts.length; i++) {
      const charWidth = textNode.measureSize(itemTexts[i]).width
      const nextCharWidth = i + 1 < itemTexts.length ? textNode.measureSize(itemTexts[i + 1]).width : 0
      const leftBound = x + runWidth + charWidth / 2
      const rightBound = x + runWidth + charWidth + nextCharWidth / 2
      if (posX >= leftBound && (i + 1 >= itemTexts.length || posX < rightBound)) {
        return info.start + i + 1
      }
      runWidth += charWidth
    }

    return info.end
  }

  // 获取指定字符位置的光标坐标
  function getCursorPosition(charIndex: number): { x: number, y: number } {
    const textNode = editTextNodeRef.value?.getNode()
    if (!textNode) return { x: 0, y: 0 }
    const linePoints = getTextDrawOrigin(textNode)
    const linePointsLocal = linePoints.map((p: any) => ({ x: p.x - textNode.x(), y: p.y - textNode.y() }))
    const lines = textNode.textArr.map((line: any) => line.text)
    const text = textNode.text()

    // 构建渲染行到原文索引映射
    let rawPtr = 0
    const lineInfos = lines.map((ln: string, i: number) => {
      let start = indexOfGrapheme(text, ln, rawPtr)
      if (start === -1) start = rawPtr
      const end = start + splitGraphemes(ln).length
      rawPtr = end
      if (text[rawPtr] === '\n') rawPtr += 1
      return { start, end, x: linePointsLocal[i].x, y: linePointsLocal[i].y, text: ln }
    })

    if (lineInfos.length === 0) return { x: 0, y: 0 }

    // 边界：小于首位或大于末尾
    if (charIndex <= 0) {
      return { x: lineInfos[0].x, y: lineInfos[0].y }
    }
    const totalLen = splitGraphemes(text).length
    if (charIndex >= totalLen) {
      const last = lineInfos[lineInfos.length - 1]
      const widthLast = textNode.measureSize(last.text).width
      return { x: last.x + widthLast, y: last.y }
    }

    // 定位到包含该索引的渲染行
    for (let i = 0; i < lineInfos.length; i++) {
      const info = lineInfos[i]
      if (charIndex >= info.start && charIndex <= info.end) {
        const inLine = Math.min(Math.max(charIndex - info.start, 0), splitGraphemes(info.text).length)
        const beforeText = splitGraphemes(info.text).slice(0, inLine).join('')
        const width = textNode.measureSize(beforeText).width
        return { x: info.x + width, y: info.y }
      }
    }

    // 如果超出文本范围，返回文本末尾
    const last = lineInfos[lineInfos.length - 1]
    const widthLast = textNode.measureSize(last.text).width
    return { x: last.x + widthLast, y: last.y }
  }

  // 鼠标按下事件
  function onMouseDown(e: any) {
    e.evt.preventDefault()
    e.evt.stopPropagation()
    focusTextarea()
    if (editing.value) {
      let pointer = e.target?.getStage()?.getPointerPosition()
      const node = editTextNodeRef.value?.getNode()
      pointer =  absoluteToRelative(node, pointer)

      const charIndex = getCharIndexAtPos(pointer.x, pointer.y)

      selectionStart = selectionEnd = charIndex

      isSelecting = true

      // 绑定 Stage 级事件，确保指针离开文本也能持续更新选区（解决旋转后命中区域不规则导致的提前断开）
      const stage = e.target?.getStage()
      if (stage) {
        const onStageMove = () => {
          if (!editing.value || !isSelecting) return
          const p = stage.getPointerPosition()
          if (!p) return
          const n = editTextNodeRef.value?.getNode()
          if (!n) return
          const local = absoluteToRelative(n, p)
          const idx = getCharIndexAtPos(local.x, local.y)
          selectionEnd = idx
          const textarea = textareaRef.value!
          setTextSelectionRange(selectionStart, selectionEnd)
          updateSelectionRects()
          updateCursor()
        }
        const onStageUp = () => {
          if (!editing.value) return
          isSelecting = false
          stage.off('.kntextselect')
        }
        // 使用命名空间，便于统一解绑
        stage.on('mousemove.kntextselect', onStageMove)
        stage.on('mouseup.kntextselect', onStageUp)
        stage.on('contentMouseup.kntextselect', onStageUp)
        stage.on('contentMouseleave.kntextselect', onStageUp)
        stage.on('touchend.kntextselect', onStageUp)
        stage.on('mouseleave.kntextselect', onStageUp)
      }

      nextTick(() => {
        const textarea = textareaRef.value
        if (!textarea) return

        textarea.focus()
        setTextSelectionRange(selectionStart, selectionEnd)

        updateSelectionRects()
        updateCursor()
      })
    }
  }


  // 添加鼠标移动事件处理
  function onMouseMove(e: any) {
    e.evt.preventDefault()
    e.evt.stopPropagation()
    if (editing.value && isSelecting) {
      let pointer = e.target?.getStage()?.getPointerPosition()
      const node = editTextNodeRef.value?.getNode()
      pointer =  absoluteToRelative(node, pointer)
      const charIndex = getCharIndexAtPos(pointer.x, pointer.y)

      selectionEnd = charIndex

      setTextSelectionRange(selectionStart, selectionEnd)

      updateSelectionRects()
      updateCursor()
    }
  }

  // 添加鼠标抬起事件处理
  function onMouseUp(e: any) {
    e.evt.preventDefault()
    e.evt.stopPropagation()
    if (!editing.value) return
    // if (e?.type === 'mouseleave') return
    isSelecting = false
    const stage = e.target?.getStage?.() || editTextNodeRef.value?.getNode()?.getStage?.()
    if (stage) stage.off('.kntextselect')
  }

  // 双击事件
  function onDblClick(e: any) {
    e.evt.preventDefault()
    e.evt.stopPropagation()
    editing.value = true
    nextTick(() => {
      onMouseDown(e)
    })
  }

  // 输入事件
  function onInput(e: Event) {
    const { value, selectionStart: textareaSelectionStart, selectionEnd: textareaSelectionEnd } = textareaRef.value!;
    e && e.stopPropagation();
    if (!editing.value || inCompositionMode.value) {
      return;
    }
    innerShapeConfig.value.text = value
    nextTick(() => {
      const startGraphemes = splitGraphemes(value.slice(0, textareaSelectionStart)).length
      const endGraphemes = splitGraphemes(value.slice(0, textareaSelectionEnd)).length
      selectionStart = startGraphemes
      selectionEnd = endGraphemes
      updateSelectionRects()
      updateCursor()
      updateBgConfig()
    })
  }

  // 更新光标
  function updateCursor() {
    const cursorPos = getCursorPosition(selectionStart)
    const textNode = editTextNodeRef.value?.getNode()
    cursorConfig.stroke = pickDarkerCaretColor(textNode)
    cursorConfig.strokeWidth = Math.max(1, Math.floor((Number(textNode?.fontSize()) || 16) / 12))

    cursorConfig.points = [
      cursorPos.x,
      cursorPos.y,
      cursorPos.x,
      cursorPos.y + innerShapeConfig.value.fontSize * (innerShapeConfig.value.lineHeight || 1)
    ]

    if (cursorBlinkInterval.value) {
      clearInterval(cursorBlinkInterval.value)
      cursorBlinkInterval.value = null
    }

    cursorConfig.visible = selectionStart === selectionEnd
    cursorConfig.opacity = 1
    if (cursorConfig.visible) {
      cursorBlinkInterval.value = setInterval(() => {
        cursorConfig.opacity = cursorConfig.opacity === 1 ? 0.5 : 1
      }, 500)
    }

    // 始终将光标与编辑文本提升到最顶层，避免被其他文本遮挡导致“光标窜位”错觉
    try {
      selectionRectsGroupRef.value?.getNode()?.moveToTop()
      editTextNodeRef.value?.getNode()?.moveToTop()
      cursorGroupRef.value?.getNode()?.moveToTop()
    } catch (err) {
      /* noop */
    }
  }

  // 分割字符串为grapheme单位，用于支持多语言
  function splitGraphemes(str: string): string[] {
    // Prefer native grapheme segmentation
    try {
      if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const seg = new Intl.Segmenter('th', { granularity: 'grapheme' })
        return Array.from(seg.segment(str), s => s.segment)
      }
    } catch {/* ignore */}

    // Fallback: base code point + following combining marks
    const out: string[] = []
    const isMark = (ch: string) => /\p{M}/u.test(ch)
    for (let i = 0; i < str.length; ) {
      const base = String.fromCodePoint(str.codePointAt(i)!)
      let j = i + base.length
      while (j < str.length) {
        const next = String.fromCodePoint(str.codePointAt(j)!)
        if (isMark(next)) j += next.length
        else break
      }
      out.push(str.slice(i, j))
      i = j
    }
    return out
  }

  // 基于grapheme单位，实现indexOf方法
  function indexOfGrapheme(str: string, search: string, start: number = 0): number {
    const hay = splitGraphemes(str)
    const needle = splitGraphemes(search)
    const hayLen = hay.length
    // 规范化起点：负数按 0，非整数下取整
    const pos = Math.max(0, Math.floor(start || 0))
    // 空 needle 行为与 String.prototype.indexOf 一致：返回 clamp(pos, [0, hayLen])
    if (needle.length === 0) return Math.min(pos, hayLen)
    if (needle.length > hayLen) return -1
    if (pos > hayLen - needle.length) return -1
    outer: for (let i = pos; i <= hayLen - needle.length; i++) {
      for (let j = 0; j < needle.length; j++) {
        if (hay[i + j] !== needle[j]) continue outer
      }
      return i
    }
    return -1
  }

  // 切割指定start, end在grapheme单位下的字符串
  function splitGraphemesRange(str: string, start: number, end: number): string {
    const graphemes = splitGraphemes(str)
    return graphemes.slice(start, end).join('')
  }

  // 选区按实际文本长度转换
  function setTextSelectionRange(start: number, end: number) {
    const textarea = textareaRef.value!
    const text = textarea.value || ''
    const startNormal = splitGraphemesRange(text, 0, start).length
    const endNormal = splitGraphemesRange(text, 0, end).length
    textarea.setSelectionRange(Math.min(startNormal, endNormal), Math.max(startNormal, endNormal))
  }

  // 更新选区
  function updateSelectionRects() {
    const textNode = editTextNodeRef.value?.getNode()
    if (!textNode) return

    const start = Math.min(selectionStart, selectionEnd)
    const end = Math.max(selectionStart, selectionEnd)

    if (start === end) {
      selectionRects.value = []
      return
    }
    const strokeWidth = innerShapeConfig.value.strokeWidth || 0

    const lines = textNode.textArr.map((line: any) => line.text)
    const linePoints = getTextDrawOrigin(textNode)
    const linePointsLocal = linePoints.map((p: any) => ({ x: p.x - textNode.x(), y: p.y - textNode.y() }))
    const singleLineHeight = Number(textNode.fontSize()) * (Number(textNode.lineHeight()) || 1)

    const rects: any[] = []
    let currentIndex = 0

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const lineLength = splitGraphemes(line).length
      const lineStart = currentIndex
      const lineEnd = currentIndex + lineLength

      // 检查当前行是否与选区重叠
      if (start < lineEnd && end > lineStart) {
        const selectionStartInLine = Math.max(0, start - lineStart)
        const selectionEndInLine = Math.min(lineLength, end - lineStart)

        if (selectionStartInLine < selectionEndInLine) {
          const beforeSelection = splitGraphemesRange(line, 0, selectionStartInLine)
          const selectedText = splitGraphemesRange(line, selectionStartInLine, selectionEndInLine)

          const beforeWidth = textNode.measureSize(beforeSelection).width
          const selectedWidth = textNode.measureSize(selectedText).width

          rects.push({
            x: linePointsLocal[lineIndex].x + beforeWidth - strokeWidth / 2,
            y: linePointsLocal[lineIndex].y - strokeWidth / 2,
            width: selectedWidth + strokeWidth,
            height: singleLineHeight + strokeWidth,
            fill: '#3b82f6',
            listening: false,
          })
        }
      }

      currentIndex += lineLength + 1
    }

    selectionRects.value = rects
  }

  // 非编辑状态 重置选区
  const cancelEdit = () => {
    selectionStart = selectionEnd = 0
    updateSelectionRects()
    updateCursor()
    textareaRef.value?.blur()
    editing.value = false
    // 解绑 Stage 级命名空间事件，避免残留监听
    try {
      const stage = textNodeRef.value?.getNode()?.getStage?.()
      if (stage) stage.off('.kntextselect')
    } catch (err) {
      /* noop */
    }
  }

  // 失去焦点
  function onBlur() {
    if (editing.value) {
      // focusTextarea()
      cancelEdit()
    }
  }

  // 键盘事件
  function onKeyDown(e: KeyboardEvent) {
    if (!editing.value) return
    e.stopPropagation()

    let newStart = selectionStart
    let newEnd = selectionEnd
    switch (e.key) {
    case 'a': {
      if (e.ctrlKey || e.metaKey) {
        newStart = 0
        newEnd = splitGraphemes(innerShapeConfig.value.text).length
      }
      break
    }
    case 'Enter': {
      updateBgConfig()
      break
    }
    case 'ArrowLeft':
      e.preventDefault()
      if (e.shiftKey) {
        newEnd = Math.max(0, newEnd - 1)
      } else {
        newStart = newEnd = Math.max(0, newStart - 1)
      }
      break
    case 'ArrowRight': {
      e.preventDefault()
      const textLength = splitGraphemes(innerShapeConfig.value.text).length
      if (e.shiftKey) {
        newEnd = Math.min(textLength, newEnd + 1)
      } else {
        newStart = newEnd = Math.min(textLength, newStart + 1)
      }
      break
    }
    case 'ArrowUp': {
      e.preventDefault()
      // 向上移动到上一行相同位置
      const textNode = editTextNodeRef.value?.getNode()
      if (!textNode) return
      const lines = textNode.textArr.map((line: any) => line.text)
      const currentLineIndex = getCurrentLineIndex(selectionStart)
      if (currentLineIndex > 0) {
        const targetLineIndex = currentLineIndex - 1
        const targetLine = lines[targetLineIndex]
        const charInCurrentLine = getCharInLine(selectionStart)
        const targetCharIndex = Math.min(charInCurrentLine, splitGraphemes(targetLine).length)

        const newIndex = getCharIndexFromLineAndChar(targetLineIndex, targetCharIndex)
        if (e.shiftKey) {
          newEnd = newIndex
        } else {
          newStart = newEnd = newIndex
        }
      }
      break
    }
    case 'ArrowDown': {
      e.preventDefault()
      // 向下移动到下一行相同位置
      const textNode = editTextNodeRef.value?.getNode()
      if (!textNode) return
      const linesDown = textNode.textArr.map((line: any) => line.text)
      const currentLineIndexDown = getCurrentLineIndex(selectionStart)
      if (currentLineIndexDown < linesDown.length - 1) {
        const targetLineIndex = currentLineIndexDown + 1
        const targetLine = linesDown[targetLineIndex]
        const charInCurrentLine = getCharInLine(selectionStart)
        const targetCharIndex = Math.min(charInCurrentLine, splitGraphemes(targetLine).length)

        const newIndex = getCharIndexFromLineAndChar(targetLineIndex, targetCharIndex)
        if (e.shiftKey) {
          newEnd = newIndex
        } else {
          newStart = newEnd = newIndex
        }
      }
      break
    }
    case 'Home': {
      e.preventDefault()
      const currentLineIndexHome = getCurrentLineIndex(selectionStart)
      const lineStartIndex = getCharIndexFromLineAndChar(currentLineIndexHome, 0)
      if (e.shiftKey) {
        newEnd = lineStartIndex
      } else {
        newStart = newEnd = lineStartIndex
      }
      break
    }
    case 'End': {
      e.preventDefault()
      const textNode = editTextNodeRef.value?.getNode()
      if (!textNode) return
      const currentLineIndexEnd = getCurrentLineIndex(selectionStart)
      const linesEnd = textNode.textArr.map((line: any) => line.text)
      const currentLineEnd = linesEnd[currentLineIndexEnd]
      const lineEndIndex = getCharIndexFromLineAndChar(currentLineIndexEnd, splitGraphemes(currentLineEnd).length)
      if (e.shiftKey) {
        newEnd = lineEndIndex
      } else {
        newStart = newEnd = lineEndIndex
      }
      break
    }
    }

    if (newStart !== selectionStart || newEnd !== selectionEnd) {
      selectionStart = newStart
      selectionEnd = newEnd
      setTextSelectionRange(selectionStart, selectionEnd)
      updateSelectionRects()
      updateCursor()
    }
  }

  // 辅助函数：获取当前行号
  function getCurrentLineIndex(charIndex: number): number {
    const textNode = editTextNodeRef.value?.getNode()
    if (!textNode) return 0
    const lines = textNode.textArr.map((line: any) => line.text)
    let currentIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const lineLength = splitGraphemes(lines[i]).length
      if (charIndex <= currentIndex + lineLength) {
        return i
      }
      currentIndex += lineLength + 1
    }
    return lines.length - 1
  }

  // 辅助函数：获取在当前行中的字符位置
  function getCharInLine(charIndex: number): number {
    const textNode = editTextNodeRef.value?.getNode()
    if (!textNode) return 0
    const lines = textNode.textArr.map((line: any) => line.text)
    let currentIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const lineLength = splitGraphemes(lines[i]).length
      if (charIndex <= currentIndex + lineLength) {
        return charIndex - currentIndex
      }
      currentIndex += lineLength + 1
    }
    return 0
  }

  // 辅助函数：从行号和行内字符位置获取全局字符索引
  function getCharIndexFromLineAndChar(lineIndex: number, charInLine: number): number {
    const textNode = editTextNodeRef.value?.getNode()
    if (!textNode) return 0
    const lines = textNode.textArr.map((line: any) => line.text)
    let charIndex = 0

    for (let i = 0; i < lineIndex; i++) {
      charIndex += splitGraphemes(lines[i]).length + 1
    }

    return charIndex + charInLine
  }

  function handleDblClick(e: any) {
    if (forbidOperate.value) {
      e.evt?.stopPropagation()
      e.evt?.preventDefault()
      return
    }
    onDblClick(e)
  }
  function handleEditDblClick(e: any) {
    if (!editing.value) return
    e?.evt?.preventDefault?.()
    e?.evt?.stopPropagation?.()
    const textarea = textareaRef.value
    if (!textarea) return
    selectionStart = 0
    selectionEnd = splitGraphemes(innerShapeConfig.value.text).length
    textarea.focus()
    setTextSelectionRange(selectionStart, selectionEnd)
    updateSelectionRects()
    updateCursor()
  }
  function handleMouseDown(e: any) {
    onMouseDown(e)
  }
  function handleMouseMove(e: any) {
    onMouseMove(e)
  }
  function handleMouseUp(e: any) {
    onMouseUp(e)
  }
  function handleDragStart(e: any) {
    if (editing.value) cancelEdit()
    emits('dragstart', e)
  }
  function handleDragMove(e: any) {
    if (editing.value) cancelEdit()
    emits('dragmove', e)
    const node = e.target
    updateBgConfig()
  }
  function handleDragEnd(e: any) {
    if (editing.value) cancelEdit()
    emits('dragend', e)
  }
  function handleTransformStart(e: any) {
    if (editing.value) cancelEdit()
    emits('transformstart', e)
  }
  function handleTransform(e: any) {
    if (editing.value) cancelEdit()
    emits('transform', e)
    const node = e.target
    updateBgConfig()
  }
  function handleTransformEnd(e: any) {
    if (editing.value) cancelEdit()
    emits('transformend', e)
  }

  // 创造textarea
  function createTextarea() {
    const textarea = document.createElement('textarea')
    textarea.value = innerShapeConfig.value.text
    Object.entries({
      id: `${componentId.value}-textarea`,
      autocapitalize: 'off',
      autocorrect: 'off',
      autocomplete: 'off',
      spellcheck: 'false',
      'data-fabric': 'textarea',
      wrap: 'off',
    }).map(([attribute, value]) => textarea.setAttribute(attribute, value));
    const stageElement = document.querySelector(`#${componentId.value} #image-editor-stage`)
    if (stageElement) {
      stageElement.appendChild(textarea)
      const handlers: Record<string, any> = {
        focus: onFocus,
        blur: onBlur,
        keydown: onKeyDown,
        input: onInput,
        paste: onPaste,
        compositionstart: onCompositionStart,
        compositionupdate: onCompositionUpdate,
        compositionend: onCompositionEnd,
      }

      Object.entries(handlers).forEach(([eventName, handler]) => {
        textarea.addEventListener(eventName, handler)
      })
      textareaRef.value = textarea
    }
    textareaRef.value = textarea
  }

  // textarea 位置
  watchEffect(() => {
    if (textareaRef.value) {
      const groupNode = cursorGroupRef.value?.getNode()
      const absolutePosition = groupNode ? relativeToAbsolute(groupNode, { x: cursorConfig.points[0], y: cursorConfig.points[1] }) : { x: cursorConfig.points[0], y: cursorConfig.points[1] }
      const left = `${absolutePosition.x}px`
      const top = `${absolutePosition.y}px`
      const fontSize = `${innerShapeConfig.value.fontSize}px`
      textareaRef.value.style.cssText = `position: absolute; top: ${top}; left: ${left}; z-index: -999; opacity: 0; width: 1px; height: 1px; font-size: 1px; padding-top: ${fontSize};`
    }
  })

  // 聚焦 textarea，尽量避免触发容器滚动
  function focusTextarea() {
    const el = textareaRef.value
    if (!el) return
    try {
        // 部分浏览器支持 preventScroll
        ;(el as any).focus({ preventScroll: true })
    } catch (_) {
      el.focus()
    }
  }

  // textarea 位置（使用舞台基准的绝对坐标，避免 group 内缩放/旋转导致的偏移）
  watchEffect(() => {
    const textarea = textareaRef.value
    if (!textarea) return
    const editNode = editTextNodeRef.value?.getNode()
    if (!editNode) return
    const stage = editNode.getStage()
    if (!stage) return
    // 获取光标点在舞台坐标系下的位置 → 转为视口坐标，使用 fixed 避免滚动联动
    const absFromNode = editNode.getAbsoluteTransform().point({ x: cursorConfig.points[0], y: cursorConfig.points[1] })
    const absFromStage = stage.getAbsoluteTransform().copy().invert().point(absFromNode)
    const containerRect = stage.container().getBoundingClientRect()
    const left = `${containerRect.left + absFromStage.x}px`
    const top = `${containerRect.top + absFromStage.y}px`
    const fontSize = `${innerShapeConfig.value.fontSize}px`
    textarea.style.cssText = `position: fixed; top: ${top}; left: ${left}; opacity: 0; width: 1px; height: 1px; font-size: 1px; padding-top: ${fontSize};`
  })

  watch(editing, (newVal) => {
    if (newVal) {
      createTextarea()
    } else {
      if (textareaRef.value) {
        textareaRef.value.remove()
      }
      if (cursorBlinkInterval.value) {
        clearInterval(cursorBlinkInterval.value)
      }
    }
    emits('editing', newVal)
  })

  function getScroller() {
    const id = componentId.value
    if (!id) return null
    return document.getElementById(id)
  }

  function logScroll(tag: string) {
    const scroller = getScroller() as HTMLElement | null
    if (!scroller) return
  }

  const savedScroll = ref<{ left: number; top: number } | null>(null)

  function setScrollerScroll(pos: { left: number; top: number } | null) {
    const scroller = getScroller() as HTMLElement | null
    if (!scroller || !pos) return
    scroller.scrollLeft = pos.left
    scroller.scrollTop = pos.top
  }

  function disableOverflowAnchor(disable: boolean) {
    const scroller = getScroller() as HTMLElement | null
    if (!scroller) return
    if (disable) {
      scroller.style.setProperty('overflow-anchor', 'none')
    } else {
      scroller.style.removeProperty('overflow-anchor')
    }
  }

  function onFocus() {
    const scroller = getScroller() as HTMLElement | null
    if (scroller) {
      savedScroll.value = { left: scroller.scrollLeft, top: scroller.scrollTop }
    }
    disableOverflowAnchor(true)
    // 立即与下一帧都尝试恢复，抵消浏览器的自动滚动
    setScrollerScroll(savedScroll.value)
    setTimeout(() => {
      setScrollerScroll(savedScroll.value)
    }, 0)
  }

  function onPaste() {
    // 保持当前滚动位置
    setScrollerScroll(savedScroll.value)
    setTimeout(() => {
      setScrollerScroll(savedScroll.value)
    }, 0)
    setTimeout(() => {
      setScrollerScroll(savedScroll.value)
    }, 50)
  }

  // 监听shapeConfig
  watch(() => shapeConfig.value, (newVal) => {
    const config = deepClone(newVal)
    if (!isSameObject(config, innerShapeConfig.value)) {
      innerShapeConfig.value = config
      if (textareaRef.value && !editing.value) {
        textareaRef.value.value = newVal.text
      }
      updateTextareaBound()
    }
  }, {
    immediate: true,
    deep: true,
  })

  watch(selectionRects, (newVal) => {
    if (newVal.length) {
      nextTick(() => {
        // 选区出现时，将相关可视元素全部置顶
        selectionRectsGroupRef.value?.getNode()?.moveToTop()
        editTextNodeRef.value?.getNode()?.moveToTop()
        cursorGroupRef.value?.getNode()?.moveToTop()
      })
    }
  })

  // 监听文本变化
  watch(() => innerShapeConfig.value.text, (newVal) => {
    if (newVal !== shapeConfig.value.text && editing.value) {
      nextTick(() => {
        const textNode = textNodeRef.value?.getNode()
        if (textNode) {
          innerShapeConfig.value.width = textNode.width()
          innerShapeConfig.value.height = textNode.height()
        }
        emits('update:shapeConfig', innerShapeConfig.value)
      })
    }
  })

  defineExpose({
    cancelEdit,
  })
</script>

<style scoped lang="less"></style>
