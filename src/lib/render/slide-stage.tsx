"use client";

import { useMemo, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Ellipse, Text as KonvaText, Image as KonvaImage, Group, Transformer } from "react-konva";
import type Konva from "konva";

import type { Slide, SlideElement } from "@/lib/schemas/slide";
import { SLIDE_DIMENSIONS } from "@/lib/schemas/slide";
import { fitFontSize } from "@/lib/render/text-layout";
import { useKonvaImage } from "@/lib/render/use-konva-image";

export interface SlideStageHandle {
  toDataURL: (opts?: { pixelRatio?: number }) => string;
}

interface SlideStageProps {
  slide: Slide;
  scale: number;
  interactive?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onCommitElement?: (elementId: string, patch: Partial<SlideElement>) => void;
  onOverflowChange?: (elementId: string, overflow: boolean) => void;
  editingElementId?: string | null;
  onStartEditText?: (elementId: string) => void;
  onCommitText?: (elementId: string, text: string) => void;
  stageRef?: (node: Konva.Stage | null) => void;
}

function BackgroundImage({ src, width, height }: { src: string | null; width: number; height: number }) {
  const image = useKonvaImage(src);
  if (!image) return null;
  return <KonvaImage image={image} x={0} y={0} width={width} height={height} listening={false} />;
}

function ImageElement({ el, listening }: { el: Extract<SlideElement, { type: "image" }>; listening: boolean }) {
  const image = useKonvaImage(el.src);
  if (!image) {
    return (
      <Rect
        width={el.width}
        height={el.height}
        fill="#E5E7EB"
        cornerRadius={el.borderRadius}
        listening={listening}
      />
    );
  }
  const sx = el.cropX * image.width;
  const sy = el.cropY * image.height;
  const sw = Math.max(1, el.cropWidth * image.width);
  const sh = Math.max(1, el.cropHeight * image.height);
  return (
    <KonvaImage
      image={image}
      crop={{ x: sx, y: sy, width: sw, height: sh }}
      width={el.width}
      height={el.height}
      cornerRadius={el.borderRadius}
      listening={listening}
    />
  );
}

function AvatarElement({ el, listening }: { el: Extract<SlideElement, { type: "avatar" }>; listening: boolean }) {
  const image = useKonvaImage(el.src);
  const radius = el.width / 2;
  return (
    <Group
      clipFunc={(ctx) => {
        ctx.arc(radius, radius, radius, 0, Math.PI * 2, false);
      }}
      listening={listening}
    >
      {image ? (
        <KonvaImage image={image} width={el.width} height={el.height} listening={false} />
      ) : (
        <Rect width={el.width} height={el.height} fill="#D1D5DB" listening={false} />
      )}
    </Group>
  );
}

function LogoElement({ el, listening }: { el: Extract<SlideElement, { type: "logo" }>; listening: boolean }) {
  const image = useKonvaImage(el.src);
  if (!image) return null;
  return <KonvaImage image={image} width={el.width} height={el.height} listening={listening} />;
}

function ShapeElement({ el, listening }: { el: Extract<SlideElement, { type: "shape" }>; listening: boolean }) {
  if (el.shape === "ellipse") {
    return (
      <Ellipse
        x={el.width / 2}
        y={el.height / 2}
        radiusX={el.width / 2}
        radiusY={el.height / 2}
        fill={el.fill}
        stroke={el.stroke ?? undefined}
        strokeWidth={el.strokeWidth}
        listening={listening}
      />
    );
  }
  return (
    <Rect
      width={el.width}
      height={el.height}
      fill={el.fill}
      stroke={el.stroke ?? undefined}
      strokeWidth={el.strokeWidth}
      cornerRadius={el.borderRadius}
      listening={listening}
    />
  );
}

function TextElement({
  el,
  listening,
  onOverflowChange,
  isEditing,
}: {
  el: Extract<SlideElement, { type: "text" }>;
  listening: boolean;
  onOverflowChange?: (overflow: boolean) => void;
  isEditing?: boolean;
}) {
  const { fontSize, layout, overflow } = useMemo(
    () =>
      fitFontSize(
        {
          text: el.text || " ",
          fontFamily: el.fontFamily,
          fontSize: el.fontSize,
          fontWeight: el.fontWeight,
          fontStyle: el.fontStyle,
          lineHeight: el.lineHeight,
          letterSpacing: el.letterSpacing,
          maxWidth: el.width,
          align: el.align,
          emphasisRanges: el.emphasisRanges,
        },
        el.autoFit ? el.height : Number.POSITIVE_INFINITY,
        el.minFontSize
      ),
    [el]
  );

  useEffect(() => {
    onOverflowChange?.(overflow);
  }, [overflow, onOverflowChange]);

  if (isEditing) return null;

  return (
    <>
      {layout.lines.map((line, li) => (
        <Group key={li} y={line.y}>
          {line.words.map((word, wi) => (
            <KonvaText
              key={wi}
              x={word.x}
              text={word.text}
              fontFamily={el.fontFamily}
              fontSize={fontSize}
              fontStyle={`${el.fontStyle} ${el.fontWeight >= 600 ? "bold" : ""}`.trim()}
              fill={word.emphasized ? el.emphasisColor || el.color : el.color}
              listening={listening}
            />
          ))}
        </Group>
      ))}
    </>
  );
}

export function SlideStage({
  slide,
  scale,
  interactive = false,
  selectedElementId,
  onSelectElement,
  onCommitElement,
  onOverflowChange,
  editingElementId,
  onStartEditText,
  stageRef,
}: SlideStageProps) {
  const { width, height } = SLIDE_DIMENSIONS[slide.format];
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Record<string, Konva.Node | null>>({});

  useEffect(() => {
    if (!interactive) return;
    const node = selectedElementId ? shapeRefs.current[selectedElementId] : null;
    if (transformerRef.current) {
      transformerRef.current.nodes(node ? [node] : []);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElementId, interactive, slide.elements]);

  const orderedElements = slide.layerOrder
    .map((id) => slide.elements.find((e) => e.id === id))
    .filter((e): e is SlideElement => Boolean(e));

  return (
    <Stage
      width={width * scale}
      height={height * scale}
      scaleX={scale}
      scaleY={scale}
      ref={(node) => stageRef?.(node)}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelectElement?.(null);
      }}
    >
      <Layer>
        {slide.background.type === "color" && (
          <Rect x={0} y={0} width={width} height={height} fill={slide.background.color} listening={false} />
        )}
        {slide.background.type === "image" && (
          <>
            <BackgroundImage src={slide.background.imageSrc} width={width} height={height} />
            {slide.background.overlayColor && slide.background.overlayOpacity > 0 && (
              <Rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill={slide.background.overlayColor}
                opacity={slide.background.overlayOpacity}
                listening={false}
              />
            )}
          </>
        )}

        {orderedElements.map((el) => {
          if (el.hidden) return null;
          const canInteract = interactive && !el.locked;
          return (
            <Group
              key={el.id}
              ref={(node) => {
                shapeRefs.current[el.id] = node;
              }}
              x={el.x}
              y={el.y}
              rotation={el.rotation}
              opacity={el.opacity}
              draggable={canInteract}
              listening={interactive}
              onClick={() => interactive && onSelectElement?.(el.id)}
              onTap={() => interactive && onSelectElement?.(el.id)}
              onDblClick={() => el.type === "text" && canInteract && onStartEditText?.(el.id)}
              onDragEnd={(e) => {
                onCommitElement?.(el.id, { x: e.target.x(), y: e.target.y() });
              }}
              onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onCommitElement?.(el.id, {
                  x: node.x(),
                  y: node.y(),
                  rotation: node.rotation(),
                  width: Math.max(20, el.width * scaleX),
                  height: Math.max(20, el.height * scaleY),
                });
              }}
            >
              {el.type === "text" && (
                <TextElement
                  el={el}
                  listening={interactive}
                  isEditing={editingElementId === el.id}
                  onOverflowChange={(overflow) => onOverflowChange?.(el.id, overflow)}
                />
              )}
              {el.type === "image" && <ImageElement el={el} listening={interactive} />}
              {el.type === "avatar" && <AvatarElement el={el} listening={interactive} />}
              {el.type === "logo" && <LogoElement el={el} listening={interactive} />}
              {el.type === "shape" && <ShapeElement el={el} listening={interactive} />}
            </Group>
          );
        })}

        <Rect
          x={slide.safeMarginPx}
          y={slide.safeMarginPx}
          width={width - slide.safeMarginPx * 2}
          height={height - slide.safeMarginPx * 2}
          stroke="rgba(37, 99, 235, 0.3)"
          dash={[8, 8]}
          listening={false}
          visible={interactive}
        />

        {interactive && (
          <Transformer
            ref={transformerRef}
            rotateEnabled
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
            }
          />
        )}
      </Layer>
    </Stage>
  );
}
