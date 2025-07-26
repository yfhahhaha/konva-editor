<template>
    <a-spin :loading="loading" :tip="loadingTip">
      <div :id="componentId" class="image-editor">
        <div
          v-if="showOperateArea"
          class="flex gap-2 operate-area"
          :class="{
            '!opacity-50 cursor-not-allowed': forbidOperate,
          }"
          :style="{
            width: `${size.width + 2}px`,
          }"
        >
          <!-- 层级编辑 -->
          <template v-if="selectedShapeIds.length && !isMultiLevelEdit">
            <div class="flex items-center gap-1.5 rounded-md bg-gray-100 pr-2">
              <div
                v-for="(item, index) in layerOperates"
                :key="index"
                class="cursor-pointer hover:bg-gray-200 rounded-md p-1"
                :class="{
                  'opacity-50 !cursor-not-allowed':
                    (selectedShapeIndex === 0 &&
                      ['bottom', 'down'].includes(item.value)) ||
                    (selectedShapeIndex === shapes.length - 1 &&
                      ['top', 'up'].includes(item.value)),
                }"
                @click="handleLayerOperate(item.value)"
              >
                <a-tooltip
                  :content="
                    selectedShapeIndex === 0 &&
                    ['bottom', 'down'].includes(item.value)
                      ? '已经是底层'
                      : selectedShapeIndex === shapes.length - 1 &&
                          ['top', 'up'].includes(item.value)
                        ? '已经是顶层'
                        : item.label
                  "
                >
                <component :is="item.icon"></component>
                </a-tooltip>
              </div>
            </div>
          </template>
          <!-- 文本编辑 -->
          <template
            v-if="
            !isMultiLevelEdit && (
              editingTextItem ||
              (selectedShapeIds.length &&
                ['v-text', 'v-text-path'].includes(selectedShape?.type))
            )
            "
          >
            <div
              class="flex items-center pr-2 gap-2 h-[30px] rounded-md bg-gray-100"
            >
              <div class="flex items-center gap-1">
                <span>
                  <a-tooltip content="字体">
                    <icon-edit />
                  </a-tooltip>
                </span>
                <select v-model="textStyle.fontFamily" class="p-0.5 rounded-md">
                  <option
                    v-for="item in FONT_LIST"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                  </option>
                </select>
              </div>
              <div class="flex items-center gap-1 ml-1">
                <span>
                  <a-tooltip content="字号">
                    <icon-h1 />
                  </a-tooltip>
                </span>
                <input
                  v-model.number="textStyle.fontSize"
                  type="number"
                  min="10"
                  max="100"
                  class="p-1 rounded-md text-center"
                />
              </div>
              <div class="flex items-center gap-1 ml-1">
                <span>
                  <a-tooltip content="行高">
                    <icon-line-height />
                  </a-tooltip>
                </span>
                <input
                  v-model.number="textStyle.lineHeight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  max="3"
                  class="p-1 rounded-md text-center"
                />
              </div>
              <div class="flex items-center gap-1 ml-1">
                <span>
                  <a-tooltip content="字体颜色">
                    <icon-font-colors />
                  </a-tooltip>
                </span>
                <a-color-picker v-model="textStyle.fill">
                  <a-tag
                    :color="textStyle.fill"
                    class="!rounded-md w-6"
                    @click.stop
                  ></a-tag>
                </a-color-picker>
              </div>
              <div class="flex items-center gap-1 ml-1">
                <span>
                  <a-tooltip content="描边颜色">
                    <icon-highlight />
                  </a-tooltip>
                </span>
                <a-color-picker v-model="textStyle.stroke">
                  <a-tag
                    :color="textStyle.stroke || '#ffffff'"
                    class="!rounded-md w-6"
                    @click.stop
                  ></a-tag>
                </a-color-picker>
              </div>
              <div class="flex items-center gap-1 ml-1">
                <span>
                  <a-tooltip content="描边宽度">
                    <icon-minus />
                  </a-tooltip>
                </span>
                <input
                  v-model.number="textStyle.strokeWidth"
                  type="number"
                  min="0"
                  step="1"
                  max="10"
                  class="p-1 rounded-md text-center"
                />
              </div>
            </div>
          </template>
          <!-- 形状边框 v-path/v-rect 但是不包含在group -->
          <template
            v-else-if="
            !isMultiLevelEdit && 
              selectedShape &&
              ['fill', 'stroke', 'strokeWidth'].some(
                (key) => selectedShape.config[key]
              )
            "
          >
            <div
              class="h-[30px] rounded-md bg-gray-100 flex items-center pr-2 gap-1.5"
            >
              <div
                v-if="
                  selectedShape.config.stroke ||
                  selectedShape.config.strokeWidth ||
                  selectedShape.config.fill
                "
                class="flex items-center gap-1.5"
              >
                <div class="flex items-center gap-1 ml-1">
                  <span>
                    <a-tooltip content="描边">
                      <icon-highlight />
                    </a-tooltip>
                  </span>
                  <a-color-picker v-model="selectedShape.config.stroke">
                    <a-tag
                      :color="selectedShape.config.stroke"
                      class="!rounded-md w-6"
                      @click.stop
                    ></a-tag>
                  </a-color-picker>
                </div>
                <div class="flex items-center gap-1 ml-1">
                  <a-tooltip content="描边宽度">
                    <icon-minus />
                  </a-tooltip>
                  <input
                    v-model.number="selectedShape.config.strokeWidth"
                    type="number"
                    min="0"
                    step="1"
                    max="10"
                    class="p-1 rounded-md text-center"
                  />
                </div>
                <div
                  v-if="selectedShape.config.fill"
                  class="flex items-center gap-1 ml-1"
                >
                  <a-tooltip content="填充颜色">
                    <icon-bg-colors />
                  </a-tooltip>
                  <a-color-picker v-model="selectedShape.config.fill">
                    <a-tag
                      :color="selectedShape.config.fill"
                      class="!rounded-md w-6"
                      @click.stop
                    ></a-tag>
                  </a-color-picker>
                </div>
              </div>
            </div>
          </template>
          <!-- 组背景/边框编辑-->
          <template v-else-if="currentGroupShape && !isMultiLevelEdit">
            <div
              v-if="currentGroupShape.border || currentGroupShape.bg"
              class="h-[30px] rounded-md bg-gray-100 flex items-center pr-2 gap-1.5"
            >
              <template v-if="currentGroupShape.border">
                <div
                  v-if="currentGroupShape.border?.config.stroke"
                  class="flex items-center gap-1.5"
                >
                  <div class="flex items-center gap-1 ml-1">
                    <span>
                      <a-tooltip content="描边">
                        <icon-highlight />
                      </a-tooltip>
                    </span>
                    <a-color-picker
                      v-model="currentGroupShape.border.config.stroke"
                    >
                      <a-tag
                        :color="currentGroupShape.border.config.stroke"
                        class="!rounded-md w-6"
                        @click.stop
                      ></a-tag>
                    </a-color-picker>
                  </div>
                  <div class="flex items-center gap-1 ml-1">
                    <span>
                      <a-tooltip content="描边宽度">
                        <icon-minus />
                      </a-tooltip>
                    </span>
                    <input
                      v-model.number="currentGroupShape.border.config.strokeWidth"
                      type="number"
                      min="0"
                      step="1"
                      max="10"
                      class="p-1 rounded-md text-center"
                    />
                  </div>
                </div>
              </template>
              <div v-if="currentGroupShape.bg?.config.fill">
                <div class="flex items-center gap-1 ml-1">
                  <a-tooltip content="背景填充">
                    <icon-bg-colors />
                  </a-tooltip>
                  <a-color-picker v-model="currentGroupShape.bg.config.fill">
                    <a-tag
                      :color="currentGroupShape.bg.config.fill"
                      class="!rounded-md w-6"
                      @click.stop
                    ></a-tag>
                  </a-color-picker>
                </div>
              </div>
            </div>
          </template>
          <!-- 图片编辑 -->
          <template v-if="currentImageShape && !isMultiLevelEdit">
            <div class="flex items-center gap-1.5 rounded-md bg-gray-100 pr-2">
              <a-tooltip content="更换本地图片">
                <span
                  class="cursor-pointer hover:bg-gray-200 rounded-md p-1 py-1"
                  @click="handleChangeLocalImage"
                >
                <icon-file-image />
                </span>
              </a-tooltip>
              <!-- 从图库选图库 回调可直接调用handleImageSelectConfirm -->
            </div>
          </template>
          <!-- 导出图片 撤销相关 -->
          <div
            class="flex items-center gap-1.5 rounded-md bg-gray-100 pr-2 h-[30px]"
          >
            <a-tooltip content="导出图片">
              <span
                class="cursor-pointer hover:bg-gray-200 rounded-md p-1 py-1"
                @click="exportImage"
              >
              <icon-download />
              </span>
            </a-tooltip>
            <a-tooltip content="撤回操作">
              <span
                :class="{
                  'opacity-50 !cursor-not-allowed':
                    isUndoOrRestore || operateHistory.length <= 1,
                }"
                class="cursor-pointer hover:bg-gray-200 rounded-md p-1 py-1"
                @click="undo"
              >
              <icon-undo />
              </span>
            </a-tooltip>
            <a-tooltip content="恢复操作">
              <span
                :class="{
                  'opacity-50 !cursor-not-allowed':
                    isUndoOrRestore || undoHistory.length < 1,
                }"
                class="cursor-pointer hover:bg-gray-200 rounded-md p-1 py-1"
                @click="restore"
              >
              <icon-redo />
              </span>
            </a-tooltip>
            <!--  -->
          </div>
          <!-- 操作说明 -->
          <a-popover title="操作说明">
            <icon-info-circle
              :size="20"
              class="shrink-0 cursor-pointer !stroke-grayText3"
            />
            <template #content>
              <div class="flex flex-col gap-1 text-base text-grayText5 max-w-96">
                <p v-for="(txt, index) in operateTips" :key="index">
                  {{ index + 1 }}. {{ txt }}
                </p>
              </div>
            </template>
          </a-popover>
        </div>
        <div
          id="image-editor-stage"
          class="show-area"
          :style="{
            width: `${size.width + 2}px`,
            height: `${size.height + 2}px`,
            border: '1px solid #E5E6EB',
          }"
        >
          <v-stage ref="stageRef" :config="stageSize" @click="handleStageClick">
            <v-layer
              @dragstart="handleLayerDragStart"
              @dragmove="handleLayerDragMove"
              @dragend="handleLayerDragEnd"
            >
              <template v-for="(shape, index) in shapes" :key="index">
                <component
                  :is="shape.type"
                  :config="shape.config"
                  @dblclick="handleDblClick($event, index)"
                  @dragstart="handleShapeDragStart($event, index)"
                  @dragmove="handleShapeDragMove($event, index)"
                  @dragend="updateShape($event, index)"
                  @transformstart="handleTransformStart($event, index)"
                  @transform="handleTransform($event, index)"
                  @transformend="handleTransformEnd($event, index)"
                >
                  <template v-if="shape.children">
                    <component
                      :is="child.type"
                      v-for="(child, cIndex) in shape.children"
                      :key="cIndex"
                      :config="child.config"
                      @dblclick="handleDblClick($event, index, cIndex)"
                      @dragstart="handleShapeDragStart($event, index, cIndex)"
                      @dragmove="handleShapeDragMove($event, index, cIndex)"
                      @dragend="updateShape($event, index, cIndex)"
                      @transformstart="
                        handleTransformStart($event, index, cIndex)
                      "
                      @transform="handleTransform($event, index, cIndex)"
                      @transformend="handleTransformEnd($event, index, cIndex)"
                    />
                  </template>
                </component>
              </template>
              <template v-if="guidesShapes.length > 0">
                <component
                  :is="guide.type"
                  v-for="(guide, index) in guidesShapes"
                  :key="index"
                  :config="guide.config"
                />
              </template>
              <v-transformer
                v-for="(id, index) in selectedShapeIds"
                :key="id"
                :ref="(el: any) => {
                  if (el) {
                    transformerRefs[id] = el
                  }
                }"
                :config="{
                  ...transformerBgConfig,
                  ...(selectedShapes[index]?.children?.length
                    ? transformerSolidConfig
                    : transformerDashConfig),
                }"
              />
            </v-layer>
          </v-stage>
        </div>
      </div>
    </a-spin>
  </template>
  
  <script setup lang="ts">
    import { computed, nextTick, onMounted, onUnmounted, reactive, ref, toRefs, watch } from 'vue'
    import {
      createCircleClipFunc,
      createDragBoundFunc,
      createSmoothRoundedClipFunc,
      deepClone,
      DEFAULT_POLYGON_RADIUS,
      deleteShapeById,
      generatePolygonPoints,
      generateSmoothRoundedPath,
      generateStrokeCss,
      getParentShapeById,
      getShapeById,
      getShapeIndexAndListById,
      findImageShape,
      IMAGE_ATTRS,
      loadImage,
      parseFontStyle,
      selectImage,
      setShapeZIndex,
      findAllImageShapesByUrl,
      IMAGE_URL_ATTRS,
      getActualSizeByPath,
      getPathBoundingSize,
      findAllTextShapes,
      createTransformBoundFunc,
      isOutOfParentRange,
      relativeToAbsolute,
      absoluteToRelative,
      createDragBoundFuncByMultiple,
      emptyBg,
      FONT_LIST,
      createRoundedRectClipFunc,
      randomString
    } from './common'
    import { showToast } from '@/composables/toast'
  
    type Shape = {
      type: string
      config: any
      children?: Shape[]
    }
  
    // 对齐线
    type LineGuide = {
      vertical: number[]
      horizontal: number[]
    }
  
    // 对齐线边缘
    type DragPosition = {
      vertical: { guide: number; offset: number; snap: string }[]
      horizontal: { guide: number; offset: number; snap: string }[]
    }
  
    // 对齐线
    type LineGuideConfig = {
      lineGuide: number
      offset: number
      orientation: string
      snap: string
    }
  
    const props = withDefaults(
      defineProps<{
        size?: {
          width: number
          height: number
        }
        showOperateArea?: boolean
        data?: Shape[]
        disabled?: boolean
      }>(),
      {
        size: () => ({ width: 800, height: 800 }),
        data: () => [],
      }
    )
  
    const { showOperateArea, size, data, disabled } =
      toRefs(props)
  
    // 操作说明
    const operateTips = ref([
      '点击元素，单选后可编辑内容',
      '选中图层回车可删除图层',
      '双击编辑文本内容, shift + enter换行',
      'ctrl/command + z/y 可撤销/恢复操作',
      'ctrl/command + 点击，可多选元素拖拽移动',
      'ctrl/command + 双击，如果当前元素有被组包裹且允许切换，可切换选中整个元素组/单个元素（单个元素选中为白色虚线框， 元素组选中为蓝色实线框）',
      '单选/多选后, ↑↓←→键可微调整位置2px/次',
    ])
  
    // 组件id 防止多组件元素定位异常
    const componentId = ref()
    const GUIDELINE_OFFSET = 5
  
    const loading = ref(false)
    const loadingTip = ref('')
    const productGalleryVisible = ref(false) // 商品图库
  
    // 上传图片
    const uploadStartCb = () => {
      loading.value = true
      loadingTip.value = '上传中...'
    }
    // 上传图片失败
    const uploadErrorCb = (error?: any) => {
      loading.value = false
    }
  
    // 选择区域是否显示
    const areaSelectVisible = ref(false)
    // 选择区域数据
    const areaSelectData = ref({
      url: '', // 可选区域的原始图片
      width: 0, // 可选区域的宽度
      height: 0, // 可选区域的高度
    })
  
    // 操作历史记录
    const operateHistory = ref<any[]>([])
    // 撤回历史
    const undoHistory = ref<any[]>([])
    // 是否正在撤回/恢复
    let isUndoOrRestore = false
  
    // 画布实例
    const stageRef = ref<any>(null)
  
    // 画布大小
    const stageSize = computed(() => ({
      width: size.value.width,
      height: size.value.height,
    }))
  
    // 编辑组合
    const shapes = ref<Shape[]>([])
  
    // 辅助线基础设置
    const guideBasicConfig = {
      stroke: 'rgb(0, 161, 255)',
      strokeWidth: 1,
      name: 'guid-line',
      dash: [4, 6],
    }
  
    // 辅助线
    const guidesShapes = ref<any[]>([])
  
    // 菜单单次偏移
    const menuOffset = 2
  
    // 选中图层编辑名称
    const selectedShapeIds = ref<string[]>([])
    // const transformer = ref<any>(null)
    const transformerRefs = ref<any>({})
    // 选中图层集合
    const selectedShapes = computed(() => {
      return selectedShapeIds.value.map((id) => getShapeById(id, shapes.value))
    })
    // 选中图层节点
    const selectedNodes = computed(() => {
      return selectedShapeIds.value.map((id) => stageRef.value?.getNode()?.findOne(`#${id}`))
    })
  
    // 当前是多层级编辑
    const isMultiLevelEdit = computed(() => {
      return selectedShapeIds.value.length > 1
    })
  
    // 选中图层
    const selectedShape = computed(() => {
      return selectedShapeIds.value.length ? selectedShapes.value[0] : null
    })
  
    // 选中图层的index
    const selectedShapeIndex = computed(() => {
      const { index, list } = getShapeIndexAndListById(
        selectedShape.value?.config?.id,
        shapes.value
      )
      return index
    })
  
    // 图层拖动、缩放、旋转中，禁止悬停菜单
    const forbidHoverMenu = ref(false)
  
    // 是否展示悬停菜单
    const showHoverMenu = ref(false)
  
    // 当前修改的图片图层
    const currentImageShape = computed(() => {
      // 是否包含图片属性
      const imageShape = findImageShape(selectedShape.value)
      // 是否允许编辑
      if (imageShape) {
        return imageShape
      }
      return null
    })
  
    // 是否展示文本智能改写编辑框
    const showTextAiEdit = ref(false)
    // 文本智能改写编辑框内容
    const textAiEditContent = ref('')
  
    // 是否展示AI图像编辑框
    const showAiImageEdit = ref(false)
  
    // 禁止操作中
    const forbidOperate = computed(() => {
      return (
        disabled.value ||
        loading.value ||
        showTextAiEdit.value ||
        showAiImageEdit.value ||
        productGalleryVisible.value
      )
    })
  
    // 选中v-label类型图层时，记录当前图层，用于编辑文本结束时，更新居中
    const labelShape = ref<Shape | null>(null)
  
    // 变换器配置
    const transformerBgConfig = {
      borderStrokeWidth: 3,
      anchorStrokeWidth: 3,
      anchorSize: 8,
      anchorCornerRadius: 5,
      rotateEnabled: false,
    }
    // 虚线框
    const transformerDashConfig = {
      borderStroke: 'white',
      borderDash: [10, 5],
      anchorStroke: 'white',
    }
    // 实线框
    const transformerSolidConfig = {
      borderStroke: '#009df9',
      anchorStroke: '#009df9',
    }
  
    // 层级操作
    const layerOperates: {
      label: string
      value: string
      icon: string
    }[] = [
      {
        label: '置顶',
        value: 'top',
        icon: 'icon-to-top',
      },
      {
        label: '上移一层',
        value: 'up',
        icon: 'icon-arrow-up',
      },
      {
        label: '下移一层',
        value: 'down',
        icon: 'icon-arrow-down',
      },
      {
        label: '置底',
        value: 'bottom',
        icon: 'icon-to-bottom',
      },
    ]
  
    // 当前编辑的文字图层
    const editingTextItem = ref<any>(null)
    const textNode = ref<any>(null)
    // 边界更新回调
    let txtBoundUpdateFunc = (newBox: any) => {}
  
    // 取消编辑
    let cancelEdit: () => void = () => {}
  
    // 默认文字设置
    const defaultTextStyle = {
      fontFamily: 'auto',
      fontSize: 24,
      fill: '#000000',
      stroke: 'rgba(255, 255, 255, 1)',
      strokeWidth: 0,
      lineHeight: 1,
    }
  
    // 文字设置
    const textStyle = reactive({
      fontFamily: defaultTextStyle.fontFamily,
      fontSize: defaultTextStyle.fontSize,
      fill: defaultTextStyle.fill,
      stroke: defaultTextStyle.stroke,
      strokeWidth: defaultTextStyle.strokeWidth,
      lineHeight: defaultTextStyle.lineHeight,
    })
  
    // 当前选中的group的背景与边框图层
    const currentGroupShape = computed<{
      bg: Shape | null
      border: Shape | null
    } | null>(() => {
      if (selectedShape.value && selectedShape.value.type === 'v-group') {
        const temps = selectedShape.value.children?.filter(
          (child: Shape) =>
            child.type !== 'v-image' &&
            ['fill', 'stroke', 'strokeWidth'].some((key) => child.config[key])
        )
        return {
          bg: temps[0] || null,
          border: temps[1] || null,
        }
      }
      return null
    })

    // 图片选择确认
    const handleImageSelectConfirm = async (src: string) => {
      try {
        if (currentImageShape.value) {
          IMAGE_ATTRS.forEach((key) => {
            if (key in currentImageShape.value.config) {
              currentImageShape.value.config[`${key}Url`] = src
              currentImageShape.value.config.originalUrl = src
            }
          })
          let img = new Image()
          if (src) {
            img = await loadImage(src)
            currentImageShape.value.config.image = img
          }
        showToast('图片已更新')
        } else {
          showToast('未找到当前选中图层')
        }
      } catch (error) {
        console.error('更换推荐图片失败', error)
      } finally {
        loading.value = false
      }
    }
  
    // 更换本地图片
    const handleChangeLocalImage = async () => {
      await selectImage(
        {
          uploadStartCb,
          uploadSuccessCb: handleImageSelectConfirm,
          uploadErrorCb,
        },
        currentImageShape.value
      )
    }
  
    // 选择区域弹窗
    const handleAreaSelect = () => {
      IMAGE_URL_ATTRS.forEach((key) => {
        if (key in currentImageShape.value.config) {
          // 记录原始图片url
          if (!currentImageShape.value.config.originalUrl) {
            currentImageShape.value.config.originalUrl =
              currentImageShape.value.config[key]
          }
          areaSelectData.value.url = currentImageShape.value.config.originalUrl
        }
      })
      const imageShape = findImageShape(currentImageShape.value)
      areaSelectData.value.width = imageShape.config.width
      areaSelectData.value.height = imageShape.config.height
      areaSelectVisible.value = true
    }
  
    const handleShapeDragStart = (event: any, index: number, cIndex?: number) => {
      forbidHoverMenu.value = true
      handleStageClick(event, true)
      selectedNodes.value.forEach((currentNode) => {
        currentNode.setAttr('startX', currentNode.x())
        currentNode.setAttr('startY', currentNode.y())
      })
      const node = event.target
      node.dragBoundFunc(createDragBoundFuncByMultiple(selectedNodes.value))
    }
  
    const handleShapeDragMove = (event: any, index: number, cIndex?: number) => {
      const shape =
        typeof cIndex === 'number'
          ? shapes.value[index].children?.[cIndex]
          : shapes.value[index]
      if (!shape) return
      const node = event.target
      const startX = node.getAttr('startX')
      const startY = node.getAttr('startY')
      // 偏移量
      const offset = {
        x: node.x() - startX,
        y: node.y() - startY,
      }
      selectedNodes.value.forEach((currentNode) => {
        const currentStartX = currentNode.getAttr('startX')
        const currentStartY = currentNode.getAttr('startY')
        const parent = currentNode.getParent()
        const position = {
          x: currentStartX,
          y: currentStartY,
        }
        const absolutePosition = parent ? relativeToAbsolute(parent, position) : position
        const targetPosition = {
          x: absolutePosition.x + offset.x,
          y: absolutePosition.y + offset.y,
        }
        if (node.id() !== currentNode.id()) {
          setNodeAbsolutePosition(currentNode, targetPosition)
        }
      })
    }
  
    // 移动更新形状
    const updateShape = (event: any, index: number, cIndex?: number) => {
      selectedNodes.value.forEach((currentNode) => {
        const shape = getShapeById(currentNode.id(), shapes.value)
        if (shape && currentNode) {
          shape.config.x = currentNode.x()
          shape.config.y = currentNode.y()
        }
      })
      forbidHoverMenu.value = false
    }
  
    // 编辑文字, 如果是v-label类型，编辑其文案时，输入框宽度为父级宽度，定位left为0
    const editText = (e: any, shape: any, parentWidth?: number) => {
      if (isMultiLevelEdit.value) {
        return
      }
      textStyle.fontSize = shape.config.fontSize || defaultTextStyle.fontSize
      textStyle.fontFamily =
        shape.config.fontFamily || defaultTextStyle.fontFamily
      textStyle.fill = shape.config.fill || defaultTextStyle.fill
      textStyle.stroke = shape.config.stroke || defaultTextStyle.stroke
      textStyle.strokeWidth =
        shape.config.strokeWidth || defaultTextStyle.strokeWidth
      textStyle.lineHeight =
        shape.config.lineHeight || defaultTextStyle.lineHeight
      shape.config.visible = false
      editingTextItem.value = shape
      textNode.value = e.target
      const textNodeKonva = textNode.value
      const maxHeight = stageSize.value.height - textNodeKonva.y()
      // const stage = textNodeKonva.getStage()
      const textPosition = textNodeKonva.absolutePosition()
      // const stageBox = stage.container().getBoundingClientRect()
      const areaPosition = {
        x: textPosition.x,
        y: textPosition.y,
      }
      // 文字偏差
      const offset = {
        x: 0,
        y: (textNodeKonva.fontSize() - 10) * 0.1
      }
  
      const textarea = document.createElement('textarea')
      const parent = document.querySelector(
        `#${componentId.value} #image-editor-stage`
      )
      parent?.appendChild(textarea)
  
      textarea.style.position = 'absolute'
      textarea.style.top = areaPosition.y - offset.y + 'px'
      textarea.style.left = parentWidth ? '0px' : areaPosition.x - offset.x + 'px'
      const width = parentWidth || shape.config.width || textNodeKonva.width()
      textarea.style.width = width + 'px'
      textarea.style.height = textNodeKonva.height() + 'px'
      textarea.style.fontSize = textNodeKonva.fontSize() + 'px'
      const { fontStyle, fontWeight } = parseFontStyle(textNodeKonva.fontStyle())
      textarea.style.fontStyle = fontStyle
      textarea.style.fontWeight = fontWeight
      textarea.style.border = 'none'
      textarea.style.padding = shape.config.padding
        ? `${shape.config.padding}px`
        : '0px'
      textarea.style.margin = '0px'
      textarea.style.overflow = 'visible'
      textarea.style.background = 'none'
      textarea.style.outline = 'none'
      textarea.style.resize = 'none'
      textarea.style.lineHeight = typeof textNodeKonva?.lineHeight === 'function'
        ? textNodeKonva?.lineHeight()
        : 1
      textarea.style.fontFamily = textNodeKonva?.fontFamily() || defaultTextStyle.fontFamily
      textarea.style.transformOrigin = 'left top'
      textarea.style.textAlign = textNodeKonva?.align()
      textarea.style.color = textNodeKonva?.fill()
      textarea.style.wordBreak = 'break-word'
      textarea.style.whiteSpace = 'normal'
      const w = textNodeKonva?.strokeWidth()
      const s = textNodeKonva?.stroke()
      if (w && s) {
        textarea.style.textShadow = generateStrokeCss(w, s)
      }
  
      const rotation = textNodeKonva.rotation()
      let transform = ''
      if (rotation) {
        transform += 'rotateZ(' + rotation + 'deg)'
      }
      textarea.style.transform = transform
  
      // 输入 更新文字
      const inputUpdate = (isComplete: boolean = true) => {
        if (!editingTextItem.value) return
        editingTextItem.value.config.text = textarea.value
        editingTextItem.value.config.width = textarea.clientWidth
        editingTextItem.value.config.height = textarea.clientHeight
        if (isComplete) {
          editingTextItem.value.config.visible = false
        }
        // 获取文本节点并计算宽度
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (context && labelShape.value) {
          context.font = `${editingTextItem.value.config.fontSize}px ${editingTextItem.value.config.fontFamily}`
          const textWidth = context.measureText(
            editingTextItem.value.config.text
          ).width
          // 计算居中位置
          const centerX = (labelShape.value?.config.parentWidth - textWidth) / 2
          labelShape.value.config.x = centerX
          labelShape.value = null
        }
      }
  
      // 裁剪内容直到高度合适
      const trimToFit = () => {
        let text = textarea.value
  
        while (textarea.scrollHeight > maxHeight && text.length > 0) {
          text = text.slice(0, -1) // 删除最后一个字符
          textarea.value = text
          textarea.style.height = 'auto'
          textarea.style.height = textarea.scrollHeight + 'px'
        }
        inputUpdate(false)
      }
  
      // 自动调整textarea高度
      const autoResize = (e?: any) => {
        inputUpdate(false)
        nextTick(() => {
          if (textarea.scrollHeight > textarea.clientHeight) {
            textarea.style.height = textarea.scrollHeight + 'px' // 设置为内容高度)
          }
          // 检查是否超出 maxHeight
          if (textarea.scrollHeight > maxHeight) {
            trimToFit()
          }
  
          textarea.focus()
        })
      }
      // 下一帧执行
      const nextAutoResize = () => {
        requestAnimationFrame(() => {
          autoResize()
        })
      }
  
      // 更新文字框边界
      txtBoundUpdateFunc = (newBox: any) => {
        textarea.style.width = newBox.width + 'px'
        textarea.style.height = newBox.height + 'px'
        textarea.style.top = newBox.y - offset.y + 'px'
        textarea.style.left = newBox.x - offset.x + 'px'
        nextTick(() => {
          autoResize()
        })
      }
  
      // 获取 textarea 原型上的原始 setter
      const descriptor = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )
      const originalSetter = descriptor?.set
      Object.defineProperty(textarea, 'value', {
        set(val) {
          originalSetter?.call(textarea, val)
          autoResize()
        },
        get() {
          return descriptor?.get?.call(textarea)
        },
      })
  
      textarea.value = textNodeKonva.text()
  
      function removeTextarea() {
        if (!editingTextItem.value) return
        textarea.removeEventListener('keydown', keydownHandler)
        textarea.removeEventListener('input', autoResize)
        textarea.removeEventListener('paste', nextAutoResize)
        textarea.removeEventListener('blur', blurHandler)
        textarea.parentNode?.removeChild(textarea)
        if (editingTextItem.value) {
          editingTextItem.value.config.visible = true
          editingTextItem.value = null
        }
      }
      cancelEdit = removeTextarea
  
      // 失焦
      const blurHandler = () => {
        inputUpdate()
        removeTextarea()
      }
  
      // 监听键盘事件
      function keydownHandler(e: any) {
        if (e.key === 'Enter' && !e.shiftKey) {
          blurHandler()
        }
      }
  
      textarea.addEventListener('keydown', keydownHandler)
      textarea.addEventListener('input', autoResize)
      textarea.addEventListener('paste', nextAutoResize)
      textarea.addEventListener('blur', blurHandler)
    }
  
    // 切换父/子图层选中
    const handleLayerSelect = (shape: Shape, index: number, cIndex?: number) => {
      const parent = getParentShapeById(shape.config.id, shapes.value)
      // 设置不可拖动
      if (!shape.config.draggable && !shape.config.originDraggable) {
        return
      }
      shape.config.draggable = !shape.config.draggable
      if (parent && parent.children?.length) {
        parent.children.forEach((child: Shape) => {
          if (child.config.id !== shape.config.id) {
            child.config.draggable = shape.config.draggable && child.config.originDraggable
          }
        })
      }
      // group/图片 当前编辑对象切换
      if (cIndex !== undefined && shapes.value[index].config.originDraggable) {
        shapes.value[index].config.draggable = !shape.config.draggable
      } else if (parent && parent.config.originDraggable) {
        parent.config.draggable = !shape.config.draggable
      } else {
        return
      }
      let curOperateShape = shape
      let newSelectedShapeIds = selectedShapeIds.value
      let childIds = []
      if (shape.config.draggable) {
        newSelectedShapeIds = newSelectedShapeIds.map((id) => {
          if (id === parent?.config.id) {
            return shape.config.id
          }
          return id
        })
        curOperateShape = shape
      } else if (
        cIndex !== undefined &&
        shapes.value[index].config.originDraggable
      ) {
        newSelectedShapeIds = newSelectedShapeIds.map((id) => {
          if (id === shape.config.id) {
            return shapes.value[index].config.id
          }
          return id
        })
        childIds = (shapes.value[index].children?.map((child: Shape) => child.config.id) || []).filter((id: string) => id !== shape.config.id)
        curOperateShape = shapes.value[index]
      } else if (parent && parent.config.originDraggable) {
        newSelectedShapeIds = newSelectedShapeIds.map((id) => {
          if (id === shape.config.id) {
            return parent.config.id
          }
          return id
        })
        childIds = (parent.children?.map((child: Shape) => child.config.id) || []).filter((id: string) => id !== shape.config.id)
        curOperateShape = parent
      }
      selectedShapeIds.value = newSelectedShapeIds.filter((id) => !childIds.includes(id)).reduce((acc: string[], sId: string) => {
        if (!acc.includes(sId)) {
          acc.push(sId)
        }
        return acc
      }, [])
      if (curOperateShape.children) {
        curOperateShape.children.forEach((child: Shape) => {
          child.config.draggable = false
        })
      }
      nextTick(() => {
        updateTransformer()
      })
    }
  
    // 双击编辑文字/切换编辑状态
    const handleDblClick = (e: any, index: number, cIndex?: number) => {
      // 阻止事件冒泡
      e.cancelBubble = true
      if (forbidOperate.value) {
        e.evt?.stopPropagation()
        e.evt?.preventDefault()
        return
      }
      const shape: any =
        typeof cIndex === 'number'
          ? shapes.value[index].children?.[cIndex]
          : shapes.value[index]
      if (!shape) return
      const isSwitch = e.evt.ctrlKey || e.evt.metaKey
      if (isSwitch) {
        if ((shape.children?.length || cIndex !== undefined)) {
          handleLayerSelect(shape, index, cIndex)
        }
      } else if (['v-text', 'v-text-path'].includes(shape.type)) {
        const parentWidth =
          shapes.value[index].type === 'v-label'
            ? shapes.value[index].config.parentWidth
            : 0
        if (parentWidth) {
          labelShape.value = shapes.value[index]
        }
        // 文字编辑
        editText(e, shape, parentWidth)
      }
    }
  
    // 上次操作的transform
    let lastTransform = {
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
      rotation: 0,
    }
    // 形状变换开始
    const handleTransformStart = (e: any, index: number, cIndex?: number) => {
      if (forbidOperate.value) {
        e.evt?.stopPropagation()
        e.evt?.preventDefault()
        return
      }
      forbidHoverMenu.value = true
      lastTransform = {
        scaleX: e.target.scaleX(),
        scaleY: e.target.scaleY(),
        x: e.target.x(),
        y: e.target.y(),
        rotation: e.target.rotation(),
      }
    }
  
    // 形状变换
    const handleTransform = (e: any, index: number, cIndex?: number) => {
      if (forbidOperate.value) {
        e.evt?.stopPropagation()
        e.evt?.preventDefault()
        return
      }
      const target = e.target
      const shape =
        typeof cIndex === 'number'
          ? shapes.value[index].children?.[cIndex]
          : shapes.value[index]
      if (!shape) return
      const activeAnchor = transformerRefs.value[shape.config.id]?.getNode().getActiveAnchor()
      const scaleX = target.scaleX()
      const scaleY = target.scaleY()
      let newWidth: number | 'auto' = target.width() * scaleX
      let newHeight: number | 'auto' = target.height() * scaleY
      // 针对文本节点处理
      if (shape.type === 'v-text') {
        const textNode = target
        const originalText = textNode.text().replace(/\s+/g, '')
        const txtHeight = textNode.getTextHeight()
        const maxWidth = stageSize.value.width - textNode.x()
        const maxHeight = stageSize.value.height - textNode.y()
  
        // 缩小时另一端自适应
        if (['middle-left', 'middle-right'].includes(activeAnchor)) {
          newHeight = 'auto'
        } else {
          let displayedText = textNode.textArr
            ?.map((item: any) => item.text)
            .join('')
            .replace(/\s+/g, '')
  
          let isOverflow = displayedText !== originalText
          while (isOverflow) {
            if (newWidth > maxWidth) {
              transformerRefs.value[shape.config.id]?.getNode().stopTransform()
              break
            }
            newWidth += txtHeight
            textNode.width(newWidth)
            textNode.getLayer()?.batchDraw()
            displayedText = textNode.textArr
              ?.map((item: any) => item.text)
              .join('')
              .replace(/\s+/g, '')
  
            isOverflow = displayedText !== originalText
          }
        }
  
        if (newWidth > maxWidth) {
          newWidth = maxWidth
          newHeight = 'auto'
        }
  
        // 临时设置尺寸
        textNode.width(newWidth)
        textNode.height(newHeight)
        textNode.scaleX(1)
        textNode.scaleY(1)
        textNode.getLayer()?.batchDraw()
  
        if (
          textNode.width() > maxWidth ||
          textNode.height() > maxHeight ||
          textNode.width() < txtHeight ||
          textNode.height() < txtHeight
        ) {
          transformerRefs.value[shape.config.id]?.getNode().stopTransform()
          target.scaleX(1)
          target.scaleY(1)
          textNode.width(shape.config.width)
          textNode.height(shape.config.height)
          textNode.getLayer()?.batchDraw()
        }
  
        // 自适应宽高
        shape.config.width = textNode.width()
        shape.config.height = textNode.height()
        target.scaleX(1)
        target.scaleY(1)
        txtBoundUpdateFunc({
          width: textNode.width(),
          height: textNode.height(),
          x: target.x(),
          y: target.y(),
          rotation: target.rotation(),
        })
      } else if (shape.type === 'v-rect') {
        // 可以保持圆角不变
        target.width(newWidth)
        target.height(newHeight)
        target.scaleX(1)
        target.scaleY(1)
        target.getLayer()?.batchDraw()
      }
  
      // 文字和图片/裁剪元素不能直接使用scale，否则会变形
      if (
        ['v-text-path', 'v-image'].includes(shape.type) ||
        shape.config.clip ||
        shape.config.clipFunc
      ) {
        // 取变化大的一边，保持比例
        const changeX = target.scaleX() - lastTransform.scaleX
        const changeY = target.scaleY() - lastTransform.scaleY
        let change = 0
        if (Math.abs(changeX) > Math.abs(changeY)) {
          change = changeX
        } else {
          change = changeY
        }
        const scale = Math.max(lastTransform.scaleX, lastTransform.scaleY) + change
        target.scaleX(scale)
        target.scaleY(scale)
      }
    }
    // 形状变换结束
    const handleTransformEnd = (e: any, index: number, cIndex?: number) => {
      if (forbidOperate.value) {
        e.evt?.stopPropagation()
        e.evt?.preventDefault()
        return
      }
      forbidHoverMenu.value = false
      const shape =
        typeof cIndex === 'number'
          ? shapes.value[index].children?.[cIndex]
          : shapes.value[index]
      if (!shape) return
  
      shape.config.scaleX = e.target.scaleX()
      shape.config.scaleY = e.target.scaleY()
      shape.config.x = e.target.x()
      shape.config.y = e.target.y()
      shape.config.rotation = e.target.rotation()
    }
  
    // 更新编辑变换器
    const updateTransformer = () => {
      selectedNodes.value.forEach((node) => {
        const id = node.id()
        const transformerNode = transformerRefs.value[id]?.getNode()
        if (!transformerNode) return
        // if (selectedNodes.some((node) => node === transformerNode.node())) {
        //   return
        // }
  
        // 如果是文字只支持 ['middle-left', 'middle-right', 'top-center', 'bottom-center']
        let enabledAnchors = [
          'top-left',
          'top-center',
          'top-right',
          'middle-right',
          'middle-left',
          'bottom-left',
          'bottom-center',
          'bottom-right',
        ]
  
        if (node?.getClassName() === 'Text') {
          enabledAnchors = [
            'middle-left',
            'middle-right',
            'top-center',
            'bottom-center',
          ]
        }
        transformerNode.enabledAnchors(enabledAnchors)
  
        if (node) {
          transformerNode.boundBoxFunc(createTransformBoundFunc(node))
          transformerNode.nodes([node])
        } else {
          transformerNode.nodes([])
        }
      })
    }
    // 点击图层
    const handleStageClick = (e: any, isDrag?: boolean) => {
      if (forbidOperate.value) {
        e.evt?.stopPropagation()
        e.evt?.preventDefault()
        return
      }
      const isMultip = e.evt.ctrlKey || e.evt.metaKey
  
      // 点击变换器 - 不做任何操作
      const clickedOnTransformer =
        e.target.getParent()?.className === 'Transformer'
      if (clickedOnTransformer) {
        return
      }
  
      // 点击图层
      const id = e.target.id()
  
      let shape = null
      const clickShape =
        getShapeById(id, shapes.value, true)
      const parentShape = getParentShapeById(id, shapes.value, true)
      if (clickShape && clickShape.config.originDraggable) {
        shape = clickShape
        clickShape.config.draggable = true
        if (parentShape) {
          parentShape.config.draggable = false
          if (parentShape.children) {
            parentShape.children.forEach((child: any) => {
              child.config.draggable = clickShape.config.originDraggable
            })
          }
        }
      } else if (parentShape && parentShape.config.originDraggable) {
        shape = parentShape
        parentShape.config.draggable = true
        if (parentShape.children) {
          parentShape.children.forEach((child: any) => {
            child.config.draggable = false
          })
        }
      }
      if (
        editingTextItem.value &&
        (!shape || shape.config.id !== editingTextItem.value.config.id)
      ) {
        cancelEdit()
      }
  
      if (shape) {
        const newSelectedShapeIds = selectedShapeIds.value.reduce((acc: string[], sId: string) => {
          const cShape = getShapeById(sId, shapes.value)
          // 是否存在父子关系，如果存在，则取消先前选中的
          const isFatherSon = sId !== shape?.config.id
            && (sId === parentShape?.config.id
              || cShape?.children?.some((child: any) => child.config.id === shape?.config.id))
          if (cShape && !isFatherSon && !acc.includes(sId)) {
            acc.push(sId)
          }
          return acc
        }, [])
        if (isMultip || (isDrag && selectedShapeIds.value.includes(shape.config.id))) {
          selectedShapeIds.value = [...newSelectedShapeIds, shape.config.id]
            .filter((id) => !(shape.children || []).map((child: any) => child.config.id).includes(id))
        } else {
          selectedShapeIds.value = [shape.config.id]
        }
      } else {
        if (!isMultip) {
          selectedShapeIds.value = []
        }
      }
      nextTick(() =>{
        updateTransformer()
      })
    }
  
    // 层级操作
    const handleLayerOperate = (value: string) => {
      if (forbidOperate.value) {
        return
      }
      if (!selectedShape.value) return
      const { index, list } = getShapeIndexAndListById(
        selectedShape.value?.config?.id,
        shapes.value
      )
      if (index === -1) return
      if (
        (['down', 'bottom'].includes(value) && index === 0) ||
        (['up', 'top'].includes(value) && index === list.length - 1)
      ) {
        return
      }
      let targetIndex = index
      switch (value) {
      case 'top':
        targetIndex = list.length - 1
        break
      case 'bottom':
        targetIndex = 0
        break
      case 'up':
        targetIndex = index + 1 < list.length ? index + 1 : list.length - 1
        break
      case 'down':
        targetIndex = index - 1 >= 0 ? index - 1 : 0
        break
      }
      const tempShape = list[index]
      list.splice(index, 1)
      list.splice(targetIndex, 0, tempShape)
      list.forEach((shape, index) => {
        shape.config.zIndex = index
      })
      selectedShapeIds.value = []
      nextTick(() => {
        selectedShapeIds.value = [list[targetIndex].config.id]
        updateTransformer()
      })
    }
  
    // 获取画布中心&其他图层对齐线位置
    const getLineGuideStops = (skipShape: any): LineGuide => {
      const vertical: any[] = [
        0,
        stageSize.value.width / 2,
        stageSize.value.width,
      ]
      const horizontal: any[] = [
        0,
        stageSize.value.height / 2,
        stageSize.value.height,
      ]
  
      const stage = stageRef.value?.getNode()
  
      stage.find('.object').forEach((guideItem: any) => {
        // 正在拖动的节点&子节点不显示对齐线
        const selectedChildIds = selectedShapeIds.value.reduce((acc: string[], id: string) => {
          const cShape = getShapeById(id, shapes.value, true)
          if (cShape?.children) {
            acc.push(...cShape.children.map((child: any) => child.config.id))
          }
          return acc
        }, [])
        if (guideItem === skipShape || selectedShapeIds.value.includes(guideItem.id()) || selectedChildIds.includes(guideItem.id())) {
          return
        }
        const box = guideItem.getClientRect()
        vertical.push([box.x, box.x + box.width, box.x + box.width / 2])
        horizontal.push([box.y, box.y + box.height, box.y + box.height / 2])
      })
      return {
        vertical: vertical.flat(),
        horizontal: horizontal.flat(),
      }
    }
  
    // 获取本身的位置点
    const getObjectSnappingEdges = (node: any): DragPosition => {
      const box = node.getClientRect()
      const absPos = node.absolutePosition()
  
      // 图形水平/垂直两端以及中心点
      return {
        vertical: [
          {
            guide: Math.round(box.x),
            offset: Math.round(absPos.x - box.x),
            snap: 'start',
          },
          {
            guide: Math.round(box.x + box.width / 2),
            offset: Math.round(absPos.x - box.x - box.width / 2),
            snap: 'center',
          },
          {
            guide: Math.round(box.x + box.width),
            offset: Math.round(absPos.x - box.x - box.width),
            snap: 'end',
          },
        ],
        horizontal: [
          {
            guide: Math.round(box.y),
            offset: Math.round(absPos.y - box.y),
            snap: 'start',
          },
          {
            guide: Math.round(box.y + box.height / 2),
            offset: Math.round(absPos.y - box.y - box.height / 2),
            snap: 'center',
          },
          {
            guide: Math.round(box.y + box.height),
            offset: Math.round(absPos.y - box.y - box.height),
            snap: 'end',
          },
        ],
      }
    }
  
    // 获取需要绘制的对齐线信息
    const getGuides = (
      lineGuideStops: LineGuide,
      itemBounds: DragPosition
    ): LineGuideConfig[] => {
      const resultV: {
        lineGuide: number
        diff: number
        snap: string
        offset: number
      }[] = []
      const resultH: {
        lineGuide: number
        diff: number
        snap: string
        offset: number
      }[] = []
  
      // 垂直辅助线
      lineGuideStops.vertical.forEach((lineGuide) => {
        itemBounds.vertical.forEach((itemBound) => {
          const diff = Math.abs(lineGuide - itemBound.guide)
          // 低于偏移量则认为对齐
          if (diff < GUIDELINE_OFFSET) {
            resultV.push({
              lineGuide: lineGuide,
              diff: diff,
              snap: itemBound.snap,
              offset: itemBound.offset,
            })
          }
        })
      })
  
      // 水平辅助线
      lineGuideStops.horizontal.forEach((lineGuide) => {
        itemBounds.horizontal.forEach((itemBound) => {
          const diff = Math.abs(lineGuide - itemBound.guide)
          if (diff < GUIDELINE_OFFSET) {
            resultH.push({
              lineGuide: lineGuide,
              diff: diff,
              snap: itemBound.snap,
              offset: itemBound.offset,
            })
          }
        })
      })
  
      const guides: LineGuideConfig[] = []
  
      // 最近辅助线 取前3条
      const minVs = resultV.sort((a, b) => a.diff - b.diff).slice(0, 3)
      const minHs = resultH.sort((a, b) => a.diff - b.diff).slice(0, 3)
      if (minVs.length) {
        minVs.forEach((minV) => {
          guides.push({
            lineGuide: minV.lineGuide,
            offset: minV.offset,
            orientation: 'V',
            snap: minV.snap,
          })
        })
      }
      if (minHs.length) {
        minHs.forEach((minH) => {
          guides.push({
            lineGuide: minH.lineGuide,
            offset: minH.offset,
            orientation: 'H',
            snap: minH.snap,
          })
        })
      }
      return guides
    }
  
    // 绘制辅助线
    const drawGuides = (guides: LineGuideConfig[]) => {
      guides.forEach((lg) => {
        if (lg.orientation === 'H') {
          guidesShapes.value.push({
            type: 'v-line',
            config: {
              ...guideBasicConfig,
              points: [-6000, 0, 6000, 0],
              x: 0,
              y: lg.lineGuide,
            },
          })
        } else if (lg.orientation === 'V') {
          guidesShapes.value.push({
            type: 'v-line',
            config: {
              ...guideBasicConfig,
              points: [0, -6000, 0, 6000],
              x: lg.lineGuide,
              y: 0,
            },
          })
        }
      })
    }
  
    // 图层拖拽开始
    const handleLayerDragStart = (e: any) => {
      if (forbidOperate.value) {
        e.evt?.stopPropagation()
        e.evt?.preventDefault()
        return
      }
      // 需要选中图层，否则移动的与操作的可能会不一致
      handleStageClick(e, true)
    }
  
    // 图层拖拽移动
    const handleLayerDragMove = (e: any) => {
      if (forbidOperate.value) {
        e.evt?.stopPropagation()
        e.evt?.preventDefault()
        return
      }
      guidesShapes.value = []
  
      const target = stageRef.value
        ?.getNode()
        .findOne('#' + selectedShape.value?.config?.id)
      if (!target) return
  
      // 获取对齐线
      const lineGuideStops = getLineGuideStops(target)
      const itemBounds = getObjectSnappingEdges(target)
      const guides = getGuides(lineGuideStops, itemBounds)
  
      console.log('guides==>', lineGuideStops, itemBounds, guides)
  
      // 如果没有辅助线，不额外绘制辅助线
      if (!guides.length) {
        return
      }
  
      // 绘制对齐线
      drawGuides(guides)
  
      const absPosArr = selectedNodes.value.map((currentNode) => {
        return {
          id: currentNode.id(),
          absPos: currentNode.absolutePosition(),
        }
      })
      const offset = {
        x: 0,
        y: 0,
      }
      const absPos = absPosArr.find((item) => item.id === target.id())?.absPos
      // 强制吸附
      guides.forEach((lg) => {
        switch (lg.orientation) {
        case 'V': {
          offset.x = lg.lineGuide + lg.offset - absPos.x
          break
        }
        case 'H': {
          offset.y = lg.lineGuide + lg.offset - absPos.y
          break
        }
        }
      })
      selectedNodes.value.forEach((item, index) => {
        const currentAbsPos = absPosArr[index]
        if (!currentAbsPos) return
        item.absolutePosition({
          x: currentAbsPos.absPos.x + offset.x,
          y: currentAbsPos.absPos.y + offset.y,
        })
      })
    }
  
    // 图层拖拽结束
    const handleLayerDragEnd = (e: any) => {
      if (forbidOperate.value) {
        e.evt?.stopPropagation()
        e.evt?.preventDefault()
        return
      }
      guidesShapes.value = []
    }
  
    /**
     * 设置节点绝对位置
     * @param node 节点
     * @param absPos 绝对位置
     */
    const setNodeAbsolutePosition = (node: any, absPos: { x: number; y: number }) => {
      const parent = node.getParent();
      if (!parent) {
        node.position(absPos);
        return;
      }
      const local = absoluteToRelative(parent, absPos);
      node.position(local);
      return local;
    }
  
    // 箭头键盘操作
    const handleArrowChange = (e: MouseEvent, value: string) => {
      if (forbidOperate.value) {
        e.stopPropagation()
        e.preventDefault()
        return
      }
      e.stopPropagation()
  
      const cbFn: any[] = []
      // 是否超出
      let isOut = false
      selectedShapeIds.value.forEach((id) => {
        const shape = getShapeById(id, shapes.value)
        if (!shape) return
        const selectedNode = stageRef.value
          ?.getNode()
          .findOne('#' + shape?.config?.id)
        if (!selectedNode) return
        const rect = {
          ...selectedNode.getClientRect({
            skipShadow: true,
            skipStroke: true,
          }),
          ...selectedNode.absolutePosition(),
        }
        switch (value) {
        case 'up':
        case 'ArrowUp':
          rect.y -= menuOffset
          break
        case 'down':
        case 'ArrowDown':
          rect.y += menuOffset
          break
        case 'left':
        case 'ArrowLeft':
          rect.x -= menuOffset
          break
        case 'right':
        case 'ArrowRight':
          rect.x += menuOffset
          break
        }
        if (isOutOfParentRange(selectedNode, null, {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        })) {
          isOut = true
          return
        }
        cbFn.push(() => {
          const local = setNodeAbsolutePosition(selectedNode, rect)
          const shape = getShapeById(id, shapes.value, true)
          if (shape) {
            shape.config.x = local.x
            shape.config.y = local.y
          }
        })
      })
      if (!isOut) {
        cbFn.forEach((fn) => {
          fn()
        })
      } else {
        showToast('不可超出边界')
      }
    }

    // 监听文字设置，如果当前有处于编辑状态的文字，则更新文字设置
    watch(
      () => textStyle,
      () => {
        if (isMultiLevelEdit.value) {
          return
        }
        if (editingTextItem.value || selectedShape.value) {
          const shape = editingTextItem.value || selectedShape.value
          if (shape) {
            shape.config.fontSize = textStyle.fontSize
            shape.config.fontFamily = textStyle.fontFamily
            shape.config.fill = textStyle.fill
            shape.config.stroke = textStyle.stroke
            shape.config.strokeWidth = textStyle.strokeWidth
            shape.config.lineHeight = textStyle.lineHeight
          }
        }
      },
      { deep: true }
    )
  
    // 监听禁止操作
    watch(
      () => forbidOperate.value,
      (newVal) => {
        stageRef.value?.getNode().listening(!newVal)
      }
    )
  
    // 数据初始化
    const initData = (data: Shape[]) => {
      document.fonts.ready.then(async () => {
        const newData = deepClone(data)
        // 设置可拖动
        const draggableSet = (item: Shape) => {
          if (!('originDraggable' in item.config)) {
            // 记录原始设置状态
            item.config.originDraggable = item.config.draggable !== false
            item.config.draggable = item.config.draggable !== false
          }
        }
        // 设置hitStrokeWidth
        const hitSet = (item: Shape) => {
          if (item.config.height < 12 || item.config.width < 12) {
            item.config.hitStrokeWidth = 12
          }
        }
        const shapePromises = newData.map(async (item: Shape) => {
          item.config.name = 'object'
          // 记录原始设置状态
          draggableSet(item)
          hitSet(item)
          // 初始化canRemove属性，只给v-image设置
          if (item.type === 'v-image') {
            if (item.config.canRemove === undefined) {
              item.config.canRemove = true
            }
          }
          // 子集需要响应事件
          if (item.children) {
            item.children.forEach((child: Shape) => {
              child.config.name = 'object'
              draggableSet(child)
              hitSet(child)
            })
            // 父级是否有可操作的子元素
            const noDraggableChild = item.children.every(
              (child: Shape) =>
                !child.config.originDraggable || child.config.listening === false
            )
            // 没有可直接操作的子元素
            if (noDraggableChild) {
              item.config.draggable = true
              item.children.forEach((child: Shape) => {
                child.config.draggable = false
              })
            }
          }
          // 设置拖动边界
          item.config.dragBoundFunc = createDragBoundFunc()
          if (item.children) {
            item.children.forEach((child: Shape) => {
              child.config.dragBoundFunc = createDragBoundFunc()
            })
          }
          // 如果是 v-group 且带有clipFuncType
          if (item.type === 'v-group' && item.config.clipFuncType) {
            if (item.config.clipFuncType === 'circle') {
              item.config.clipFunc = createCircleClipFunc(
                item.config.width / 2,
                item.config.width / 2,
                item.config.width / 2
              )
            } else if (item.config.clipFuncType === 'polygon') {
              const size = Math.max(item.config.width, item.config.height) / 2
              const sides = item.config.clipFuncSides
              const radius = item.config.clipFuncRadius || DEFAULT_POLYGON_RADIUS
              if (sides) {
                const points: { x: number; y: number }[] = generatePolygonPoints(
                  sides,
                  size
                )
                item.config.clipFunc = createSmoothRoundedClipFunc(points, radius)
                const paths: Shape[] =
                  item.children?.filter(
                    (child: Shape) => child.type === 'v-path' && !child.config.data
                  ) || []
                if (paths.length) {
                  const pathStr = generateSmoothRoundedPath(points, radius)
                  paths.forEach((path: Shape) => {
                    path.config.data = pathStr
                  })
                }
              }
            } else if (item.config.clipFuncType === 'roundedRect') {
              item.config.clipFunc = createRoundedRectClipFunc(
                item.config.width,
                item.config.height,
                item.config.clipFuncRadius
              )
            }
          }
          // 如果是v-group，去且有clipFunc
          if (
            item.type === 'v-group' &&
            (item.config.clip || item.config.clipFunc)
          ) {
            const imageShapes = findAllImageShapesByUrl(item)
            if (imageShapes.length) {
              let customSize = { width: 0, height: 0 }
              const path = item.children?.find(
                (child: Shape) => child.type === 'v-path'
              )
              if (path) {
                customSize = getPathBoundingSize(path.config.data)
              } else if (item.config.clip) {
                customSize = {
                  width: item.config.clip.width,
                  height: item.config.clip.height,
                }
              } else {
                const radius = item.children?.find(
                  (child: Shape) => 'radius' in child.config
                )
                if (radius) {
                  customSize = {
                    width: radius.config.radius * 2,
                    height: radius.config.radius * 2,
                  }
                }
              }
              if (customSize.width && customSize.height) {
                item.config.width = customSize.width
                item.config.height = customSize.height
                imageShapes.forEach((imageShape: Shape) => {
                  imageShape.config.width = customSize.width
                  imageShape.config.height = customSize.height
                  imageShape.config.scaleX = 1
                  imageShape.config.scaleY = 1
                  imageShape.config.x = 0
                  imageShape.config.y = 0
                  imageShape.config.offsetX = 0
                  imageShape.config.offsetY = 0
                  imageShape.config.rotation = 0
                  imageShape.config.originDraggable = false
                  imageShape.config.draggable = false
                })
              }
            }
          }
  
          if (item.type === 'v-path') {
            // 如果是v-path,且带有clipFuncType
            if (item.config.clipFuncType === 'polygon') {
              const size = Math.max(item.config.width, item.config.height) / 2
              const sides = item.config.clipFuncSides
              const radius = item.config.clipFuncRadius || DEFAULT_POLYGON_RADIUS
              if (sides) {
                const points: { x: number; y: number }[] = generatePolygonPoints(
                  sides,
                  size
                )
                // 按path中的点获取实际宽高
                const actualSize = getActualSizeByPath(points)
                item.config.width = actualSize.width
                item.config.height = actualSize.height
                const pathStr = generateSmoothRoundedPath(points, radius)
                item.config.data = pathStr
              }
            } else if (item.config.data) {
              // 自定义path
              const pathSize = getPathBoundingSize(item.config.data)
              item.config.width = pathSize.width
              item.config.height = pathSize.height
            }
          }
          // 如果有图片图层
          const imageShapes = findAllImageShapesByUrl(item)
          if (imageShapes.length) {
            const imageLoadPromises: Promise<boolean>[] = imageShapes.map(
              async (imageShape: Shape) => {
                return new Promise(async (resolve, reject) => {
                  try {
                    const key = IMAGE_URL_ATTRS.find((k) => k in imageShape.config)
                    if (key && imageShape.config && key in imageShape.config) {
                      const img = await loadImage(imageShape.config[key])
                      if (imageShape.config[key] && img.src === emptyBg) {
                        console.log(`${imageShape.config.id}节点图片加载失败原图：${imageShape.config[key]}`)
                        imageShape.config[key] = ''
                        imageShape.config.originalUrl = ''
                        showToast(`${imageShape.config.id}节点图片加载失败，已替换为空占位显示`)
                      }
                      if (img && img.width && img.height) {
                        imageShape.config[key.replace('Url', '')] = img
                        if (
                          key === 'imageUrl' &&
                          (!imageShape.config.width || !imageShape.config.height)
                        ) {
                          const parentShape = getParentShapeById(
                            imageShape.config.id,
                            newData,
                            true
                          )
                          const parentWidth =
                            !parentShape && key === 'imageUrl'
                              ? stageSize.value.width
                              : parentShape?.config?.width ||
                                imageShape.config.width
                          const parentHeight =
                            !parentShape && key === 'imageUrl'
                              ? stageSize.value.height
                              : parentShape?.config?.height ||
                                imageShape.config.height
                          const scale = Math.max(
                            parentWidth / img.width,
                            parentHeight / img.height
                          )
                          imageShape.config.width = img.width * scale
                          imageShape.config.height = img.height * scale
                        } else if (
                          key === 'fillPatternImageUrl' &&
                          (!imageShape.config.fillPatternScale?.x ||
                            !imageShape.config.fillPatternScale?.y)
                        ) {
                          const width =
                            imageShape.config.width || imageShape.config.radius * 2
                          const height =
                            imageShape.config.height || imageShape.config.radius * 2
                          if (width && height) {
                            const scale = Math.max(
                              width / img.width,
                              height / img.height
                            )
                            imageShape.config.fillPatternRotation = 0
                            imageShape.config.fillPatternScale = {
                              x: scale,
                              y: scale,
                            }
                            // 居中显示
                            imageShape.config.fillPatternOffset = {
                              x: (img.width * scale - width) / 2,
                              y: (img.height * scale - height) / 2,
                            }
                          }
                        }
                      } else {
                        reject(new Error('图片加载失败'))
                      }
                    }
                    resolve(true)
                  } catch (error) {
                    reject(error)
                  }
                })
              }
            )
            // 等待 group 中所有 image 加载
            await Promise.all(imageLoadPromises).catch((error) => {
              console.error('imageLoadPromises error==>', error)
            })
          }
          // 获取所有文本节点, 默认不设高度, 否则超出会被裁剪, 如果没有宽度，则设置宽度为画布宽度-x - 5
          const textShapes = findAllTextShapes(item)
          textShapes.forEach((textShape: Shape) => {
            textShape.config.wrap = 'word'
            textShape.config.fillAfterStrokeEnabled = true
            if (!textShape.config.width) {
              textShape.config.width =
                stageSize.value.width - textShape.config.x - 5
            }
            if (textShape.config.height) {
              delete textShape.config.height
            }
          })
  
          return item
        })
  
        const newShapes = await Promise.all(shapePromises)
        shapes.value = newShapes
  
        // 层级数据初始化
        nextTick(() => {
          setShapeZIndex(shapes.value, stageRef.value?.getNode())
        })
      })
    }
  
    // 监听data
    watch(
      data,
      (val) => {
        initData(val)
      },
      { deep: true }
    )
  
    // 监听画布渲染
    watch(
      stageRef,
      (newVal, oldVal) => {
        if (newVal && !oldVal) {
          initData(data.value)
        }
      },
      { deep: true, immediate: true }
    )
  
    // 监听数据变化
    watch(
      shapes,
      (newVal, oldVal) => {
        console.log('shapes==>', newVal)
        if (isUndoOrRestore) {
          isUndoOrRestore = false
          return
        } else {
          operateHistory.value.push(deepClone(newVal))
          // 一旦有新操作，清空撤回记录
          undoHistory.value = []
        }
      },
      { deep: true }
    )
  
    // 监听当前选中
    watch(
      selectedShape,
      (newVal, oldVal) => {
        if (!newVal) {
          showHoverMenu.value = false
          showTextAiEdit.value = false
          textAiEditContent.value = ''
          showAiImageEdit.value = false
        } else {
          if (['v-text', 'v-text-path'].includes(newVal.type) && !isMultiLevelEdit.value) {
            // 文字设置跟随
            textStyle.fontSize =
              newVal.config.fontSize || defaultTextStyle.fontSize
            textStyle.fontFamily = newVal.config.fontFamily || defaultTextStyle.fontFamily
            textStyle.fill = newVal.config.fill || defaultTextStyle.fill
            textStyle.stroke = newVal.config.stroke || defaultTextStyle.stroke
            textStyle.strokeWidth =
              newVal.config.strokeWidth || defaultTextStyle.strokeWidth
            textStyle.lineHeight =
              newVal.config.lineHeight || defaultTextStyle.lineHeight
          }
          if (newVal.type !== 'v-text') {
            showTextAiEdit.value = false
            textAiEditContent.value = ''
          } else if (!currentImageShape.value) {
            showAiImageEdit.value = false
          }
        }
      },
      { deep: true }
    )
  
    // 撤回
    const undo = () => {
      if (operateHistory.value.length > 1 && !isUndoOrRestore) {
        isUndoOrRestore = true
        // 将当前状态移入 undoHistory
        const current = operateHistory.value.pop()
        if (current) undoHistory.value.push(deepClone(current))
        // 还原为上一个状态
        const previous = operateHistory.value[operateHistory.value.length - 1]
        shapes.value = deepClone(previous)
      }
    }
  
    // 恢复
    const restore = () => {
      if (undoHistory.value.length > 0 && !isUndoOrRestore) {
        isUndoOrRestore = true
        const restored = undoHistory.value.pop()
        if (restored) {
          shapes.value = deepClone(restored)
          operateHistory.value.push(deepClone(restored))
        }
      }
    }
  
    // 删除图层
    const deleteShape = () => {
      if (selectedShape.value && !editingTextItem.value) {
        deleteShapeById(selectedShape.value.config.id, shapes.value)
        selectedShapeIds.value = []
        updateTransformer()
      }
    }
  
    // 监听键盘事件
    const handleKeydown = (e: any) => {
      if (showTextAiEdit.value) {
        e.stopPropagation()
        return
      }
      if (e.key === 'Backspace' && !e.target.tagName.includes('INPUT')) {
        deleteShape()
      } else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        // ctrl + z /command + z
        undo()
      } else if (
        (e.key.toLowerCase() === 'y' ||
          (e.key.toLowerCase() === 'z' && e.shiftKey)) &&
        (e.ctrlKey || e.metaKey)
      ) {
        // ctrl + y || ctrl + shift + y || command + y || command + shift + y
        restore()
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedShapeIds.value.length) {
          e.preventDefault()
          handleArrowChange(e, e.key)
        }
      }
    }
  
    // 监听画布外的点击事件 取消图层选中
    const handleClick = (e: any) => {
      const el = document.querySelector(
        `#${componentId.value} #image-editor-stage`
      )
      // 排除弹窗和下拉框
      const notHiddenClasss = ['operate-area', 'arco-modal-container', 'arco-trigger-popup']
      if (
        // loading中不取消选中
        !loading.value &&
        !forbidOperate.value &&
        el &&
        !el.contains(e.target as Node) &&
        !notHiddenClasss.some((className) => e.target.closest(`.${className}`))
      ) {
        selectedShapeIds.value = []
        updateTransformer()
        if (editingTextItem.value) {
          cancelEdit()
        }
      }
    }
  
    onMounted(() => {
      componentId.value = `editor-${randomString()}`
      window.addEventListener('keydown', handleKeydown)
      window.addEventListener('click', handleClick, { capture: true })
    })
  
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('click', handleClick, { capture: true })
    })
  
    // 导出图片
    const exportImage = () => {
      // 先取消选中编辑，否则图片会有编辑器框
      selectedShapeIds.value = []
      updateTransformer()
      const stage = stageRef.value.getNode()
      const dataURL = stage.toDataURL({ pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = 'canvas.png'
      link.href = dataURL
      link.click()
    }
  
    defineExpose({
      shapes: () => shapes.value,
      exportImage: exportImage,
      getNode: () => stageRef.value?.getNode(),
    })
  </script>
  
  <style lang="less">
    .konvajs-content {
      position: relative;
      overflow: hidden;
    }
    .menu-dropdown {
      .arco-dropdown {
        width: 102px;
        padding: 4px 0px;
        border-radius: 8px;
        border: 1px solid var(---color-border-2, #e5e6eb);
        background: var(---color-bg-5, #fff);
        box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.1);
        .arco-dropdown-option {
          line-height: unset;
          padding: 7px 12px;
          overflow: hidden;
          color: var(---color-text-1, #1d2129);
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: 'HarmonyOS Sans SC';
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 22px;
        }
      }
    }
  </style>
  
  <style lang="less" scoped>
    .image-editor {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 10px;
      .operate-area {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 8px;
        .text-style-area {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 5px;
          label {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
          }
        }
        .operate-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 5px 10px;
          border-radius: 5px;
          background-color: #f0f0f0;
          cursor: pointer;
          user-select: none;
          label {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
          }
          &.primary {
            color: #5757ff;
            background: #e5ecff;
          }
          &.danger {
            color: #f53f3f;
            background: #ffece8;
          }
          &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
      .show-area {
        position: relative;
        // border: 1px solid #ccc;
      }
      .menu-btn {
        all: unset;
        position: absolute;
        transform: translate(-100%, -10px);
        z-index: 99;
        &.image-btn {
          transform: translate(0%, 0%);
        }
        .menu-btn-inner {
          margin: 10px 0px;
          width: 102px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: var(---color-text-1, #1d2129);
          color: var(---White, #fff);
  
          /* 14/CN-Regular */
          font-family: 'HarmonyOS Sans SC';
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 32px; /* 157.143% */
          white-space: nowrap;
          cursor: pointer;
        }
      }
      .menu-tab {
        position: fixed;
        width: min-content;
        z-index: 10;
        display: flex;
        padding: 4px 0px;
        flex-direction: column;
        align-items: flex-start;
        border-radius: 4px;
        border: 1px solid var(---color-border-2, #e5e6eb);
        background: var(---color-bg-5, #fff);
  
        /* shadow/一级下拉菜单 */
        box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.1);
      }
    }
    :deep(.arco-tag.arco-tag-custom-color) {
      // border: 1px solid #5757ff;
      color: #5757ff;
    }
  </style>
  