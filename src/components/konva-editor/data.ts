import { getGradientPointsByAngle } from "./common";

// 示例模版
export const exampleData = 
    {
      id: 'demo_edit_template',
      name: '示例模版',
      size: {
        width: 600,
        height: 600,
      },
      operateArea: true,
      layers: [
        {
          type: 'v-rect',
          config: {
            id: 'demo_edit_template_rect_bg_1',
            x: 0,
            y: 0,
            width: 600,
            height: 600,
            fill: '#FFF9F0',
            draggable: false,
            listening: false, // 背景禁止操作
          },
        },
        {
          type: 'v-image',
          config: {
            id: 'demo_edit_template_image001',
            x: 30,
            y: 30,
            width: 540,
            height: 540,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            imageUrl: new URL('./assets/image_002.png', import.meta.url).href,
          },
        },
        {
          type: 'v-group',
          config: {
            id: 'demo_edit_template_group_0',
            x: 0,
            y: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            draggable: true,
          },
          children: [
            {
                type: 'v-rect',
                config: {
                  id: 'demo_edit_template_rect_bg_2',
                  x: 0,
                  y: 0,
                  width: 600,
                  height: 120,
                  fillLinearGradientStartPoint: getGradientPointsByAngle(600,100,-270).start,
                  fillLinearGradientEndPoint: getGradientPointsByAngle(600,100,-270).end,
                  fillLinearGradientColorStops: [0, 'rgba(0, 0, 0, 0.1)', 1, 'rgba(0, 0, 0, 0.5)']
                },
            },
            {
              type: 'v-text',
              config: {
                id: 'demo_edit_template_title',
                text: '测试文本测试文本测试文本',
                x: 50,
                y: 50,
                width: 500,
                fontSize: 32,
                align: 'center',
                fontStyle: '900',
                lineHeight: 1.1,
                fill: '#ffffff',
                stroke: '#94ff05',
                strokeWidth: 5,
                fillAfterStrokeEnabled: true,
                draggable: true,
              },
            },
          ]
        },
        {
          type: 'v-group',
          config: {
            id: 'demo_edit_template_group_1',
            x: 400,
            y: 400,
            width: 150,
            height: 150,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            draggable: true,
            clipFuncType: 'circle', // 'circle' | 'polygon' | 'roundedRect'
          },
          children: [
            {
              type: 'v-circle',
              config: {
                x: 75,
                y: 75,
                radius: 75,
                fill: '#ffffff',
                stroke: 'transparent',
                draggable: false,
                listening: false,
              },
            },
            {
              type: 'v-image',
              config: {
                id: 'demo_edit_template_image002',
                x: 0,
                y: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                imageUrl: new URL('./assets/image_001.png', import.meta.url).href,
              },
            },
            {
              type: 'v-circle',
              config: {
                x: 75,
                y: 75,
                radius: 75,
                fill: 'transparent',
                stroke: '#94ff05',
                strokeWidth: 5,
                draggable: false,
                listening: false,
              },
            },
          ],
        },
        {
          type: 'v-group',
          config: {
            id: 'demo_edit_template_group_2',
            x: 50,
            y: 181,
            width: 160,
            height: 160,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            draggable: true,
            clipFuncType: 'polygon',
            clipFuncSides: 6,
            clipFuncRadius: 10,
          },
          children: [
            {
              type: 'v-path',
              config: {
                fill: '#ffffff',
                stroke: 'transparent',
                strokeWidth: 0,
                listening: false,
              },
            },
            {
              type: 'v-image',
              config: {
                id: 'demo_edit_template_image003',
                width: 160,
                height: 160,
                x: 0,
                y: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                imageUrl: new URL('./assets/image_003.png', import.meta.url).href,
              },
            },
            {
              type: 'v-path',
              config: {
                fill: 'transparent',
                stroke: '#94ff05',
                strokeWidth: 5,
                listening: false,
              },
            },
          ],
        },
        {
          type: 'v-group',
          config: {
            id: 'demo_edit_template_group_3',
            x: 250,
            y: 200,
            width: 150,
            height: 150,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            draggable: true,
            clipFuncType: 'roundedRect',
            clipFuncRadius: [100, 0, 100, 0],
          },
          children: [
            {
              type: 'v-image',
              config: {
                id: 'demo_edit_template_image004',
                width: 150,
                height: 150,
                x: 0,
                y: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                imageUrl: new URL('./assets/image_003.png', import.meta.url).href,
                draggable: false
              },
            },
          ],
        }
      ],
    }