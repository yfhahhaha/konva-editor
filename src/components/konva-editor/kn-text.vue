<template>
  <v-group>
    <!-- 文本背景 -->
    <v-rect :key="`${innerShapeConfig.id}-bg`" :config="textBgConfig" />
    <v-text
      ref="textNodeRef"
      :config="{ ...innerShapeConfig, draggable: !editing && config.draggable, visible: !editing, listening: !editing && config.listening, height: 'auto' }"
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
      <v-rect
        v-for="(rect, i) in selectionRects"
        :key="`${innerShapeConfig.id}-selection-rect-${i}`"
        :config="rect"
      />
      <!-- 编辑中文本 -->
      <v-text
        ref="editTextNodeRef"
        :config="{
            ...innerShapeConfig,
            draggable: false,
            height: 'auto',
          }"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mousemove="handleMouseMove"
      />
      <!-- 自定义光标 -->
      <v-line ref="cursorNodeRef" :config="cursorConfig" />
    </template>
  </v-group>
</template>

<script setup lang="ts">
  import { ref, nextTick, onMounted, toRefs, watch, reactive, watchEffect, onUnmounted } from 'vue'
  import { absoluteToRelative, deepClone, relativeToAbsolute } from './common';

  const props = defineProps<{
    componentId: string
    config: any // 不使用
    shapeConfig: any // 用于双向绑定
  }>()
  const emits = defineEmits(['dblclick', 'dragstart', 'dragmove', 'dragend', 'transformstart', 'transform', 'transformend', 'editing', 'update:shapeConfig'])

  const { componentId, shapeConfig } = toRefs(props)

  // 内部shapeConfig
  const innerShapeConfig = ref(deepClone(shapeConfig.value))

  // 编辑中
  const editing = ref(false)
  const textareaRef = ref<HTMLTextAreaElement | null>(null)
  const textNodeRef = ref<any>(null)
  const editTextNodeRef = ref<any>(null)
  const cursorNodeRef = ref<any>(null)
  // 操作框节点
  const transformerNode = ref<any>(null)
  // 原始锚点
  const originEnabledAnchors = ref<any[]>([])

  // 背景
  const textBgConfig = ref<any>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  // 更新背景配置
  const updateBgConfig = (newBox?: {
    x: number
    y: number
    width: number
    height: number
  }) => {
    const textNode = textNodeRef.value?.getNode()
    const box = newBox || (textNode && {
      x: textNode.x(),
      y: textNode.y(),
      width: textNode.width(),
      height: textNode.height(),
    })
    if (box && innerShapeConfig.value) {
      const padding = Array.isArray(innerShapeConfig.value.bgPadding) ? innerShapeConfig.value.bgPadding : new Array(4).fill(innerShapeConfig.value.bgPadding || 0)
      const background = innerShapeConfig.value.background || 'rgba(0, 0, 0, 0)'
      const cornerRadius =  innerShapeConfig.value.bgCornerRadius || 0
      textBgConfig.value = {
        x: box.x - padding[3],
        y: box.y - padding[0],
        width: box.width + padding[3] + padding[1],
        height: box.height + padding[0] + padding[2],
        fill: background,
        cornerRadius: cornerRadius,
        visible: innerShapeConfig.value.background
      }
    }
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
  const cursorIndex = ref(0)

  /**
   * Composition start
   */
  function onCompositionStart() {
    inCompositionMode.value = true
  }

  /**
   * Composition update
   */
  function onCompositionUpdate({ target }: CompositionEvent) {
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
    const singleLineHeight = textNode.fontSize() * (textNode.lineHeight() || 1)

    return textArr.map((line: any, index: number) => {
      const size = textNode.measureSize(line.text)
      const textWidth = Number(size.width)
      // 水平对齐偏移
      let offsetX = 0
      if (align === 'center') {
        offsetX = (width - textWidth) / 2
      } else if (align === 'right') {
        offsetX = width - textWidth
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
    const lines = textNode.textArr.map((line: any) => line.text)
    const singleLineHeight = textNode.fontSize() * (textNode.lineHeight() || 1)
    // 确定行号
    let lineIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (posY >= linePoints[i].y && posY < linePoints[i].y + singleLineHeight) {
        lineIndex = i
        break
      }
    }
    lineIndex = Math.max(0, lineIndex)

    let charIndex = 0
    let totalWidth = 0
    const x = linePoints[lineIndex].x
    const totalLineWidth = textNode.measureSize(lines[lineIndex]).width
    const firstTextWidth = textNode.measureSize(lines[lineIndex][0]).width
    if (posX <= x + firstTextWidth / 2) {
      charIndex = lines.reduce((acc: number, line: string, index: number) => {
        if (index < lineIndex) {
          return acc + line.length + 1
        }
        return acc
      }, 0)
    }else if (posX >= x + totalLineWidth) {
      charIndex = lines.reduce((acc: number, line: string, index: number) => {
        if (index <= lineIndex) {
          return acc + line.length + 1
        }
        return acc
      }, 0) - 1
    } else {
      for (let i = 0; i < lines[lineIndex].length; i++) {
        const charWidth = textNode.measureSize(lines[lineIndex][i]).width
        const nextCharWidth = i + 1 < lines[lineIndex].length ? textNode.measureSize(lines[lineIndex][i + 1]).width : 0
        if (posX >= x + totalWidth + charWidth / 2 && (i + 1 > lines[lineIndex].length || posX < x + totalWidth + charWidth + nextCharWidth / 2)) {
          charIndex = i + 1
          for (let j = 0; j < lineIndex; j++) {
            charIndex += lines[j].length + 1
          }
          break
        }
        totalWidth += charWidth
      }
    }

    return charIndex
  }

  // 获取指定字符位置的光标坐标
  function getCursorPosition(charIndex: number): { x: number, y: number } {
    const textNode = editTextNodeRef.value?.getNode()
    if (!textNode) return { x: 0, y: 0 }
    const linePoints = getTextDrawOrigin(textNode)
    const lines = textNode.textArr.map((line: any) => line.text)

    let currentIndex = 0
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const lineLength = line.length

      if (charIndex <= currentIndex + lineLength) {
        // 在当前行中
        const charInLine = charIndex - currentIndex
        const beforeText = line.slice(0, charInLine)
        const width = textNode.measureSize(beforeText).width

        return {
          x: linePoints[lineIndex].x + width,
          y: linePoints[lineIndex].y
        }
      }

      currentIndex += lineLength + 1
    }

    // 如果超出文本范围，返回文本末尾
    const lastLine = lines[lines.length - 1] || ''
    const width = textNode.measureSize(lastLine).width
    return {
      x: linePoints[lines.length - 1].x + width,
      y: linePoints[lines.length - 1].y
    }
  }

  // 鼠标按下事件
  function onMouseDown(e: any) {
    e.evt.preventDefault()
    e.evt.stopPropagation()
    textareaRef.value?.focus()
    if (editing.value) {
      let pointer = e.target?.getStage()?.getPointerPosition()
      pointer =  absoluteToRelative(e.target?.getParent(), pointer)

      const charIndex = getCharIndexAtPos(pointer.x, pointer.y)

      selectionStart = selectionEnd = charIndex

      isSelecting = true

      nextTick(() => {
        const textarea = textareaRef.value
        if (!textarea) return

        textarea.focus()
        textarea.setSelectionRange(Math.min(selectionStart, selectionEnd), Math.max(selectionStart, selectionEnd))

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
      pointer =  absoluteToRelative(e.target?.getParent(), pointer)
      const charIndex = getCharIndexAtPos(pointer.x, pointer.y)

      selectionEnd = charIndex

      const textarea = textareaRef.value!
      textarea.setSelectionRange(Math.min(selectionStart, selectionEnd), Math.max(selectionStart, selectionEnd))

      updateSelectionRects()
      updateCursor()
    }
  }

  // 添加鼠标抬起事件处理
  function onMouseUp(e: any) {
    e.evt.preventDefault()
    e.evt.stopPropagation()
    if (editing.value) {
      isSelecting = false
    }
  }

  // 双击事件
  function onDblClick(e: any) {
    e.evt.preventDefault()
    e.evt.stopPropagation()
    editing.value = true
    const stage = e.target.getStage()
    const transformer = stage?.findOne('Transformer')
    if (transformer) {
      transformerNode.value = transformer
      const enabledAnchors = transformer.enabledAnchors()
      if (enabledAnchors.length > 0) {
        originEnabledAnchors.value = enabledAnchors
        transformer.enabledAnchors([])
      }
    }
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
    cursorIndex.value = textareaSelectionStart ?? value.length
    innerShapeConfig.value.text = value
    nextTick(() => {
      selectionStart = textareaSelectionStart
      selectionEnd = textareaSelectionEnd
      updateSelectionRects()
      updateCursor()
      updateBgConfig()
    })
  }

  // 更新光标
  function updateCursor() {
    const cursorPos = getCursorPosition(selectionStart)
    const textNode = editTextNodeRef.value?.getNode()
    cursorConfig.stroke = textNode?.fill() || 'black'

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
    const singleLineHeight = textNode.fontSize() * (textNode.lineHeight() || 1)

    const rects: any[] = []
    let currentIndex = 0

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const lineLength = line.length
      const lineStart = currentIndex
      const lineEnd = currentIndex + lineLength

      // 检查当前行是否与选区重叠
      if (start < lineEnd && end > lineStart) {
        const selectionStartInLine = Math.max(0, start - lineStart)
        const selectionEndInLine = Math.min(lineLength, end - lineStart)

        if (selectionStartInLine < selectionEndInLine) {
          const beforeSelection = line.slice(0, selectionStartInLine)
          const selectedText = line.slice(selectionStartInLine, selectionEndInLine)

          const beforeWidth = textNode.measureSize(beforeSelection).width
          const selectedWidth = textNode.measureSize(selectedText).width

          rects.push({
            x: linePoints[lineIndex].x + beforeWidth - strokeWidth / 2,
            y: linePoints[lineIndex].y - strokeWidth / 2,
            width: selectedWidth + strokeWidth,
            height: singleLineHeight + strokeWidth,
            fill: '#3b82f6'
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
    if (transformerNode.value && originEnabledAnchors.value.length > 0) {
      transformerNode.value.enabledAnchors(originEnabledAnchors.value)
    }
  }

  // 失去焦点
  function onBlur() {
    if (editing.value) {
      textareaRef.value!.focus()
    }
  }

  // 键盘事件
  function onKeyDown(e: KeyboardEvent) {
    if (!editing.value) return
    e.stopPropagation()

    const textarea = textareaRef.value!
    let newStart = selectionStart
    let newEnd = selectionEnd
    switch (e.key) {
    case 'a': {
      if (e.ctrlKey || e.metaKey) {
        newStart = 0
        newEnd = innerShapeConfig.value.text.length
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
    case 'ArrowRight':
      e.preventDefault()
      if (e.shiftKey) {
        newEnd = Math.min(innerShapeConfig.value.text.length, newEnd + 1)
      } else {
        newStart = newEnd = Math.min(innerShapeConfig.value.text.length, newStart + 1)
      }
      break
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
        const currentLine = lines[currentLineIndex]
        const charInCurrentLine = getCharInLine(selectionStart)
        const targetCharIndex = Math.min(charInCurrentLine, targetLine.length)

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
        const currentLine = linesDown[currentLineIndexDown]
        const charInCurrentLine = getCharInLine(selectionStart)
        const targetCharIndex = Math.min(charInCurrentLine, targetLine.length)

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
      const lineEndIndex = getCharIndexFromLineAndChar(currentLineIndexEnd, currentLineEnd.length)
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
      textarea.setSelectionRange(Math.min(selectionStart, selectionEnd), Math.max(selectionStart, selectionEnd))
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
      const lineLength = lines[i].length
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
      const lineLength = lines[i].length
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
      charIndex += lines[i].length + 1
    }

    return charIndex + charInLine
  }

  function handleDblClick(e: any) {
    onDblClick(e)
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
    if (editing.value) return
    emits('dragstart', e)
  }
  function handleDragMove(e: any) {
    if (editing.value) return
    emits('dragmove', e)
    const node = e.target
    updateBgConfig({
      x: node.x(),
      y: node.y(),
      width: node.width(),
      height: node.height(),
    })
  }
  function handleDragEnd(e: any) {
    if (editing.value) return
    emits('dragend', e)
  }
  function handleTransformStart(e: any) {
    if (editing.value) return
    emits('transformstart', e)
  }
  function handleTransform(e: any) {
    if (editing.value) return
    emits('transform', e)
  }
  function handleTransformEnd(e: any) {
    if (editing.value) return
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
        // focus: (e: any) => console.log('focus', e),
        blur: (e: any) => onBlur,
        keydown: onKeyDown,
        // keyup: (e: any) => console.log('keyup', e),
        input: onInput,
        // copy: (e: any) => console.log('copy', e),
        // cut: (e: any) => console.log('cut', e),
        // paste: (e: any) => console.log('paste', e),
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
      const parent = editTextNodeRef.value?.getNode()?.getParent()
      const absolutePosition = parent ? relativeToAbsolute(parent, { x: cursorConfig.points[0], y: cursorConfig.points[1] }) : { x: cursorConfig.points[0], y: cursorConfig.points[1] }
      const left = `${absolutePosition.x}px`
      const top = `${absolutePosition.y}px`
      const fontSize = `${innerShapeConfig.value.fontSize}px`
      textareaRef.value.style.cssText = `position: absolute; top: ${top}; left: ${left}; z-index: -999; opacity: 0; width: 1px; height: 1px; font-size: 1px; padding-top: ${fontSize};`
    }
  })

  // 监听编辑状态
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
    // 向父级传递编辑状态
    emits('editing', newVal)
  })

  // 监听shapeConfig
  watch(() => shapeConfig.value, (newVal) => {
    innerShapeConfig.value = deepClone(newVal)
    if (textareaRef.value) {
      textareaRef.value.value = newVal.text
    }
  }, {
    immediate: true,
    deep: true,
  })

  // 监听选区矩形 防止动态调整选区时，文本与光标被盖
  watch(selectionRects, (newVal) => {
    if (newVal.length) {
      nextTick(() => {
        editTextNodeRef.value?.getNode().moveToTop();
        cursorNodeRef.value?.getNode().moveToTop();
      })
    }
  })

  // 监听文本变化
  watch(() => innerShapeConfig.value.text, (newVal) => {
    if (newVal !== shapeConfig.value.text && editing.value) {
      emits('update:shapeConfig', innerShapeConfig.value)
    }
  })

  defineExpose({
    cancelEdit,
  })
</script>

<style scoped lang="less"></style>
