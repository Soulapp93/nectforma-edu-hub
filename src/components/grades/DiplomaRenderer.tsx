import React from 'react';
import QRCode from 'react-qr-code';
import { FORMAT_DIMENSIONS, type DiplomaTemplate, type DiplomaElement, diplomaService } from '@/services/diplomaService';

interface RendererProps {
  template: DiplomaTemplate;
  face?: 'recto' | 'verso';
  context: {
    student: { first_name: string; last_name: string };
    formation: { title: string; level?: string; academic_year?: string };
    establishment: { name: string };
    transcript?: { general_average?: number | null; decision?: string; mention?: string; jury_date?: string };
    diplomaNumber: string;
    verificationCode: string;
  };
  scale?: number;
  /** Inner ref for html2canvas capture */
  innerRef?: React.Ref<HTMLDivElement>;
}

export const DiplomaRenderer: React.FC<RendererProps> = ({ template, face = 'recto', context, scale = 1, innerRef }) => {
  const td = template.template_data;
  const format = (td as any).format || (template.orientation === 'portrait' ? 'A4P' : 'A4L');
  const dims = FORMAT_DIMENSIONS[format as keyof typeof FORMAT_DIMENSIONS] || FORMAT_DIMENSIONS.A4L;
  const bg = face === 'recto' ? td.backgroundColor : (td.backgroundColorVerso || '#f9fafb');
  const elements = (td.elements || []).filter((el: DiplomaElement) => (el.face || 'recto') === face);

  const borderStyleCss: React.CSSProperties = (() => {
    if (td.borderStyle === 'double') return { border: `${td.borderWidth || 4}px double ${td.borderColor || '#d4af37'}` };
    if (td.borderStyle === 'simple') return { border: `${td.borderWidth || 3}px solid ${td.borderColor || '#333'}` };
    if (td.borderStyle === 'ornate')  return { border: `${td.borderWidth || 3}px solid ${td.borderColor || '#9333ea'}`, boxShadow: `inset 0 0 0 ${(td.borderWidth || 3) + 6}px ${td.borderColor || '#9333ea'}20` };
    return {};
  })();

  const resolve = (content: string) => diplomaService.resolveVariables(
    content || '',
    context.student,
    context.formation,
    context.establishment,
    context.transcript,
    context.diplomaNumber,
    context.verificationCode,
  );

  const wm = td.watermark;

  return (
    <div
      ref={innerRef as any}
      className="relative bg-white shadow-xl overflow-hidden"
      style={{
        width: dims.w * scale,
        height: dims.h * scale,
        backgroundColor: bg,
        position: 'relative',
        ...borderStyleCss,
      }}
    >
      {/* Watermark */}
      {wm?.enabled && (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 0,
        }}>
          <span style={{
            fontFamily: 'Georgia',
            fontWeight: 800,
            fontSize: wm.size * scale,
            color: wm.color,
            opacity: wm.opacity,
            transform: `rotate(${wm.angle}deg)`,
            letterSpacing: 12 * scale,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}>{wm.text}</span>
        </div>
      )}

      {elements.map((el: DiplomaElement) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: el.x * scale,
          top: el.y * scale,
          width: el.width * scale,
          height: el.height * scale,
        };

        if (el.type === 'line') {
          return <div key={el.id} style={{ ...style, backgroundColor: el.styles?.backgroundColor || '#000', opacity: el.styles?.opacity ?? 1 }} />;
        }
        if (el.type === 'rectangle') {
          return <div key={el.id} style={{
            ...style,
            backgroundColor: el.styles?.backgroundColor || 'transparent',
            border: `${(el.styles?.borderWidth || 1) * scale}px solid ${el.styles?.borderColor || '#000'}`,
            borderRadius: (el.styles?.borderRadius || 0) * scale,
            opacity: el.styles?.opacity ?? 1,
          }} />;
        }
        if (el.type === 'signature_zone') {
          const content = resolve(el.content);
          return (
            <div key={el.id} style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
              <div style={{ width: '80%', borderBottom: '1px solid #999', marginBottom: 4 * scale, paddingTop: (el.height - 30) * scale }} />
              <span style={{ fontSize: (el.styles?.fontSize || 11) * scale, color: el.styles?.color || '#444', fontFamily: el.styles?.fontFamily, fontStyle: 'italic' }}>{content}</span>
            </div>
          );
        }
        if (el.type === 'qr_code') {
          const qrValue = el.content === '{code_verification}'
            ? `${window.location.origin}/verify-diploma/${context.verificationCode}`
            : resolve(el.content);
          return (
            <div key={el.id} style={{ ...style, backgroundColor: el.styles?.backgroundColor || '#fff', padding: 4 * scale }}>
              <QRCode value={qrValue} style={{ width: '100%', height: '100%' }} />
            </div>
          );
        }
        if (el.type === 'image' || el.type === 'signature_image' || el.type === 'stamp') {
          return (
            <div key={el.id} style={{ ...style, borderRadius: (el.styles?.borderRadius || 0) * scale, opacity: el.styles?.opacity ?? 1 }}>
              {el.content ? <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : null}
            </div>
          );
        }

        // text / variable
        const content = resolve(el.content);
        return (
          <div key={el.id} style={{
            ...style,
            fontSize: (el.styles?.fontSize || 14) * scale,
            fontFamily: el.styles?.fontFamily,
            fontWeight: el.styles?.fontWeight as any,
            fontStyle: el.styles?.fontStyle,
            textAlign: el.styles?.textAlign as any,
            color: el.styles?.color,
            textDecoration: el.styles?.textDecoration,
            letterSpacing: el.styles?.letterSpacing,
            display: 'flex',
            alignItems: 'center',
            justifyContent: el.styles?.textAlign === 'center' ? 'center' : el.styles?.textAlign === 'right' ? 'flex-end' : 'flex-start',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            opacity: el.styles?.opacity ?? 1,
          }}>
            <span className="truncate w-full" style={{ textAlign: el.styles?.textAlign as any }}>{content}</span>
          </div>
        );
      })}
    </div>
  );
};

export default DiplomaRenderer;
