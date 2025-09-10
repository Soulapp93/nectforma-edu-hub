import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  width?: number;
  height?: number;
  onSave: (signature: string) => void;
  onCancel: () => void;
  initialSignature?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  width = 400,
  height = 200,
  onSave,
  onCancel,
  initialSignature
}) => {
  console.log('SignaturePad component loaded successfully');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Configuration du canvas
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2;
    context.strokeStyle = '#000000';

    // Effacer le canvas
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    // Charger la signature initiale si elle existe
    if (initialSignature) {
      console.log('Chargement de la signature initiale...');
      const img = new Image();
      img.onload = () => {
        console.log('Signature initiale chargée avec succès');
        context.drawImage(img, 0, 0, width, height);
        setIsEmpty(false);
      };
      img.onerror = (error) => {
        console.error('Erreur lors du chargement de la signature initiale:', error);
      };
      img.src = initialSignature;
    } else {
      setIsEmpty(true);
    }
  }, [width, height, initialSignature]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const startDrawing = (pos: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    setIsDrawing(true);
    setIsEmpty(false);
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  };

  const draw = (pos: { x: number; y: number }) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    context.lineTo(pos.x, pos.y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getMousePos(e);
    startDrawing(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getMousePos(e);
    draw(pos);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    startDrawing(pos);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    draw(pos);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    setIsEmpty(true);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border border-gray-200 cursor-crosshair touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        <p className="text-sm text-gray-500 mt-2 text-center">
          Signez dans la zone ci-dessus
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={clearCanvas}
          disabled={isEmpty}
          className="flex items-center"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Effacer
        </Button>
        
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Annuler
        </Button>

        <Button
          onClick={saveSignature}
          disabled={isEmpty}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Valider ma signature
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;